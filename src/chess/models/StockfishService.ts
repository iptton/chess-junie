import { Piece, PieceType, PieceColor, Position, Move } from './types';
import { Board } from './Board';

export class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private moveResolve: ((move: Move) => void) | null = null;
  private moveReject: ((error: Error) => void) | null = null;

  constructor() {
    this.initializeStockfish();
  }

  private initializeStockfish(): void {
    try {
      // Create a web worker for Stockfish
      this.worker = new Worker(new URL('stockfish', import.meta.url));

      // Set up message handler
      this.worker.onmessage = (e) => this.handleStockfishMessage(e.data);

      // Initialize Stockfish
      this.sendCommand('uci');
      this.sendCommand('isready');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
    }
  }

  private sendCommand(command: string): void {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }

  private handleStockfishMessage(message: string): void {
    console.log('Stockfish:', message);

    if (message.includes('readyok')) {
      this.isReady = true;
    }

    // Parse "bestmove" response
    if (message.includes('bestmove')) {
      const bestMove = message.split(' ')[1];
      if (bestMove && this.moveResolve) {
        const from = this.algebraicToPosition(bestMove.substring(0, 2));
        const to = this.algebraicToPosition(bestMove.substring(2, 4));

        // Create a move object
        const move: Move = { from, to };

        this.moveResolve(move);
        this.moveResolve = null;
        this.moveReject = null;
      }
    }
  }

  public async getBestMove(board: Board, currentPlayer: PieceColor = PieceColor.WHITE, depth: number = 10): Promise<Move> {
    if (!this.worker || !this.isReady) {
      throw new Error('Stockfish is not ready');
    }

    return new Promise<Move>((resolve, reject) => {
      this.moveResolve = resolve;
      this.moveReject = reject;

      // Convert board to FEN notation
      const fen = this.boardToFEN(board, currentPlayer);

      // Set position and calculate best move
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);
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
  }
}
