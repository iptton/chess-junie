import { Piece, PieceType, PieceColor, Position, Move } from './types';
import { Board } from './Board';

export class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private moveResolve: ((move: Move) => void) | null = null;
  private moveReject: ((error: Error) => void) | null = null;
  private readyPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;

  constructor() {
    this.initializeStockfish();
  }

  private initializeStockfish(): void {
    // Create a new ready promise
    this.readyPromise = new Promise<void>((resolve) => {
      this.readyResolve = resolve;
    });

    try {
      // Check if SharedArrayBuffer is available
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

      if (!hasSharedArrayBuffer) {
        console.warn(
          'SharedArrayBuffer is not available. This may affect Stockfish performance. ' +
          'To enable SharedArrayBuffer, the server must send the following headers: ' +
          'Cross-Origin-Opener-Policy: same-origin, Cross-Origin-Embedder-Policy: require-corp'
        );
      }

      // Try different approaches to initialize Stockfish
      try {
        if (hasSharedArrayBuffer) {
          // If SharedArrayBuffer is available, try to use the full-featured version
          try {
            // Import Stockfish as an ES module
            // This ensures Vite processes it correctly and includes the WASM file
            const stockfishUrl = new URL('stockfish', import.meta.url).href;
            this.worker = new Worker(stockfishUrl, { type: 'module' });
          } catch (e) {
            // @ts-ignore
            if (e.toString().includes('SharedArrayBuffer')) {
              throw e; // Re-throw to fall back to non-SharedArrayBuffer version
            }
            console.warn('Failed to initialize Stockfish with ES module, trying alternative:', e);
            // Second try: Use the classic type
            this.worker = new Worker(new URL('stockfish', import.meta.url) + '?worker_file&type=classic', { type: 'classic' });
          }
        } else {
          // If SharedArrayBuffer is not available, use WASM version that doesn't require it
          console.warn('Using WASM version of Stockfish that does not require SharedArrayBuffer');
          this.worker = new Worker(new URL('stockfish', import.meta.url), { type: 'module' });
        }
      } catch (e) {
        console.warn('Failed to initialize Stockfish with preferred method, trying fallback:', e);
        try {
          // Final fallback: Try the module version which should work in most environments
          this.worker = new Worker(new URL('stockfish', import.meta.url), { type: 'module' });
        } catch (e2) {
          console.warn('Failed to initialize Stockfish with module type, trying last resort:', e2);
          // Last resort: Use the original approach with classic type
          this.worker = new Worker(new URL('stockfish', import.meta.url) + '?worker_file&type=classic', { type: 'classic' });
        }
      }

      // Set up message handler
      this.worker.onmessage = (e: MessageEvent<string>) => this.handleStockfishMessage(e.data);

      // Initialize Stockfish
      this.sendCommand('uci');
      this.sendCommand('isready');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      // Set isReady to false to ensure getBestMove throws an appropriate error
      this.isReady = false;

      // Reject the ready promise if it exists
      if (this.readyResolve) {
        this.readyResolve = null;
        this.readyPromise = Promise.reject(new Error('Failed to initialize Stockfish'));
      }
    }
  }

  private sendCommand(command: string): void {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }

  /**
   * Waits for Stockfish to be ready
   * @returns A promise that resolves when Stockfish is ready
   */
  public async waitForReady(): Promise<void> {
    // If Stockfish is already ready, resolve immediately
    if (this.isReady) {
      return Promise.resolve();
    }

    // If Stockfish is not initialized, try to initialize it
    if (!this.worker) {
      this.initializeStockfish();
    }

    // Return the ready promise
    return this.readyPromise || Promise.reject(new Error('Failed to initialize Stockfish'));
  }

  private handleStockfishMessage(message: string): void {
    console.log('Stockfish:', message);

    if (message.includes('readyok')) {
      this.isReady = true;
      // Resolve the ready promise
      if (this.readyResolve) {
        this.readyResolve();
        this.readyResolve = null;
      }
    }

    // Parse "bestmove" response
    if (message.includes('bestmove')) {
      const bestMove = message.split(' ')[1];
      if (bestMove && bestMove !== '(none)' && this.moveResolve) {
        try {
          const from = this.algebraicToPosition(bestMove.substring(0, 2));
          const to = this.algebraicToPosition(bestMove.substring(2, 4));

          // Create a move object
          const move: Move = { from, to };

          this.moveResolve(move);
        } catch (error) {
          // If there's an error parsing the move, reject the promise
          if (this.moveReject) {
            this.moveReject(new Error(`Failed to parse Stockfish move: ${bestMove}`));
          }
        } finally {
          // Always clean up
          this.moveResolve = null;
          this.moveReject = null;
        }
      } else if (this.moveReject) {
        // If bestMove is invalid or '(none)', reject the promise
        this.moveReject(new Error(`Invalid move from Stockfish: ${bestMove}`));
        this.moveResolve = null;
        this.moveReject = null;
      }
    } else if (message.includes('Unknown command') || message.includes('error')) {
      // Handle error messages from Stockfish
      if (this.moveReject) {
        this.moveReject(new Error(`Stockfish error: ${message}`));
        this.moveResolve = null;
        this.moveReject = null;
      }
    }
  }

  public async getBestMove(board: Board, currentPlayer: PieceColor = PieceColor.WHITE, depth: number = 10): Promise<Move> {
    try {
      // Wait for Stockfish to be ready
      await this.waitForReady();

      // If we got here, Stockfish is ready
      if (!this.worker) {
        throw new Error('Stockfish worker is not initialized');
      }
    } catch (error) {
      console.error('Failed to wait for Stockfish to be ready:', error);
      throw new Error('Stockfish is not ready');
    }

    return new Promise<Move>((resolve, reject) => {
      this.moveResolve = resolve;
      this.moveReject = reject;

      // Set a timeout to prevent hanging if Stockfish doesn't respond
      const timeoutId = setTimeout(() => {
        if (this.moveReject) {
          this.moveReject(new Error('Stockfish timed out'));
          this.moveResolve = null;
          this.moveReject = null;
        }
      }, 10000); // 10 seconds timeout

      // Convert board to FEN notation
      const fen = this.boardToFEN(board, currentPlayer);

      // Set position and calculate best move
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);

      // Add a handler to clear the timeout when the move is resolved
      const originalResolve = this.moveResolve;
      this.moveResolve = (move: Move) => {
        clearTimeout(timeoutId);
        if (originalResolve) {
          originalResolve(move);
        }
      };

      const originalReject = this.moveReject;
      this.moveReject = (error: Error) => {
        clearTimeout(timeoutId);
        if (originalReject) {
          originalReject(error);
        }
      };
    });
  }

  private boardToFEN(board: Board, currentPlayer: PieceColor = PieceColor.WHITE): string {
    let fen = '';

    // Board position
    for (let y = 7; y >= 0; y--) {
      let emptyCount = 0;

      for (let x = 0; x < 8; x++) {
        const piece = board.getPieceAt({ x, y });

        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }

          let pieceChar = this.pieceToFENChar(piece);
          fen += pieceChar;
        } else {
          emptyCount++;
        }
      }

      if (emptyCount > 0) {
        fen += emptyCount;
      }

      if (y > 0) {
        fen += '/';
      }
    }

    // Active color
    fen += currentPlayer === PieceColor.WHITE ? ' w' : ' b';

    // Castling availability (assuming all castling is available for simplicity)
    fen += ' KQkq';

    // En passant target square (none for simplicity)
    fen += ' -';

    // Halfmove clock and fullmove number (0 and 1 for simplicity)
    fen += ' 0 1';

    return fen;
  }

  private pieceToFENChar(piece: Piece): string {
    let char = '';

    switch (piece.type) {
      case PieceType.PAWN:
        char = 'p';
        break;
      case PieceType.KNIGHT:
        char = 'n';
        break;
      case PieceType.BISHOP:
        char = 'b';
        break;
      case PieceType.ROOK:
        char = 'r';
        break;
      case PieceType.QUEEN:
        char = 'q';
        break;
      case PieceType.KING:
        char = 'k';
        break;
    }

    if (piece.color === PieceColor.WHITE) {
      char = char.toUpperCase();
    }

    return char;
  }

  private algebraicToPosition(algebraic: string): Position {
    const x = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
    const y = parseInt(algebraic[1]) - 1;
    return { x, y };
  }

  public dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
    this.readyResolve = null;
    this.readyPromise = null;
    this.moveResolve = null;
    this.moveReject = null;
  }
}
