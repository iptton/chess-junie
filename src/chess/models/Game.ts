import { Board } from './Board';
import { MoveValidator } from './MoveValidator';
import { PieceColor, Position, Move, GameStatus } from './types';
import { StockfishService } from './StockfishService';

export enum GameMode {
  HUMAN_VS_HUMAN = 'human_vs_human',
  HUMAN_VS_AI = 'human_vs_ai'
}

export class Game {
  private board: Board;
  private moveValidator: MoveValidator;
  private currentPlayer: PieceColor;
  private moveHistory: Move[];
  private status: GameStatus;
  private gameMode: GameMode;
  private aiColor: PieceColor;
  private stockfishService: StockfishService | null = null;
  private aiThinking: boolean = false;

  constructor(gameMode: GameMode = GameMode.HUMAN_VS_HUMAN, aiColor: PieceColor = PieceColor.BLACK) {
    this.board = new Board();
    this.moveValidator = new MoveValidator(this.board);
    this.currentPlayer = PieceColor.WHITE; // White starts
    this.moveHistory = [];
    this.status = GameStatus.ACTIVE;
    this.gameMode = gameMode;
    this.aiColor = aiColor;

    if (gameMode === GameMode.HUMAN_VS_AI) {
      this.stockfishService = new StockfishService();

      // If AI plays as white, make the first move
      if (this.aiColor === PieceColor.WHITE) {
        // Call makeAIMove and handle the promise
        this.makeAIMove().then(result => {
          if (!result) {
            console.error('AI move failed');
          }
        }).catch(error => {
          console.error('AI move error:', error);
        });
      }
    }
  }

  public getBoard(): Board {
    return this.board;
  }

  public getCurrentPlayer(): PieceColor {
    return this.currentPlayer;
  }

  public getStatus(): GameStatus {
    return this.status;
  }

  public getMoveHistory(): Move[] {
    return [...this.moveHistory];
  }

  public makeMove(from: Position, to: Position, callback?: () => void): boolean {
    // Check if the game is still active
    if (this.status !== GameStatus.ACTIVE && this.status !== GameStatus.CHECK) {
      return false;
    }

    // Validate the move
    if (!this.moveValidator.isValidMove(from, to, this.currentPlayer)) {
      return false;
    }

    // Make the move
    const move = this.board.movePiece(from, to);
    if (!move) {
      return false;
    }

    // Add to move history
    this.moveHistory.push(move);

    // Switch player
    this.currentPlayer = this.currentPlayer === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

    // Update game status
    this.updateGameStatus();

    // If it's AI's turn and the game is still active, make AI move
    if (this.gameMode === GameMode.HUMAN_VS_AI && 
        this.currentPlayer === this.aiColor && 
        (this.status === GameStatus.ACTIVE || this.status === GameStatus.CHECK)) {
      // Call makeAIMove and handle the promise
      this.makeAIMove(callback).then(result => {
        if (!result) {
          console.error('AI move failed');
        }
      }).catch(error => {
        console.error('AI move error:', error);
      });
    }

    return true;
  }

  public async makeAIMove(callback?: () => void): Promise<boolean> {
    if (!this.stockfishService || this.aiThinking || 
        this.currentPlayer !== this.aiColor || 
        (this.status !== GameStatus.ACTIVE && this.status !== GameStatus.CHECK)) {
      return false;
    }

    this.aiThinking = true;

    try {
      // Get best move from Stockfish
      const move = await this.stockfishService.getBestMove(this.board, this.currentPlayer);

      // Make the move
      const result = this.makeMove(move.from, move.to);

      // Call the callback if provided
      if (callback) {
        callback();
      }

      return result;
    } catch (error) {
      console.error('AI move error:', error);
      return false;
    } finally {
      this.aiThinking = false;
    }
  }

  public getGameMode(): GameMode {
    return this.gameMode;
  }

  public getAIColor(): PieceColor {
    return this.aiColor;
  }

  public setGameMode(mode: GameMode, aiColor: PieceColor = PieceColor.BLACK, callback?: () => void): void {
    // If changing to AI mode
    if (mode === GameMode.HUMAN_VS_AI && this.gameMode !== GameMode.HUMAN_VS_AI) {
      this.stockfishService = new StockfishService();
    } 
    // If changing from AI mode
    else if (mode !== GameMode.HUMAN_VS_AI && this.gameMode === GameMode.HUMAN_VS_AI) {
      if (this.stockfishService) {
        this.stockfishService.dispose();
        this.stockfishService = null;
      }
    }

    this.gameMode = mode;
    this.aiColor = aiColor;

    // If it's already AI's turn, make a move
    if (mode === GameMode.HUMAN_VS_AI && 
        this.currentPlayer === this.aiColor && 
        (this.status === GameStatus.ACTIVE || this.status === GameStatus.CHECK)) {
      // Call makeAIMove and handle the promise
      this.makeAIMove(callback).then(result => {
        if (!result) {
          console.error('AI move failed');
        }
      }).catch(error => {
        console.error('AI move error:', error);
      });
    }
  }

  public isAIThinking(): boolean {
    return this.aiThinking;
  }

  private updateGameStatus(): void {
    // Check if the current player is in check
    if (this.moveValidator.isInCheck(this.currentPlayer)) {
      // Check if it's checkmate
      if (this.moveValidator.isCheckmate(this.currentPlayer)) {
        this.status = GameStatus.CHECKMATE;
      } else {
        this.status = GameStatus.CHECK;
      }
    } else {
      // Check if it's stalemate (no legal moves but not in check)
      const pieces = this.board.getPieces().filter(p => p.color === this.currentPlayer);
      let hasLegalMove = false;

      for (const piece of pieces) {
        for (let x = 0; x < 8; x++) {
          for (let y = 0; y < 8; y++) {
            const to = { x, y };
            if (this.moveValidator.isValidMove(piece.position, to, this.currentPlayer)) {
              hasLegalMove = true;
              break;
            }
          }
          if (hasLegalMove) break;
        }
        if (hasLegalMove) break;
      }

      if (!hasLegalMove) {
        this.status = GameStatus.STALEMATE;
      } else {
        this.status = GameStatus.ACTIVE;
      }
    }
  }

  public resetGame(callback?: () => void): void {
    // Store current game mode and AI color
    const currentGameMode = this.gameMode;
    const currentAIColor = this.aiColor;

    // Reset board and game state
    this.board.resetBoard();
    this.currentPlayer = PieceColor.WHITE;
    this.moveHistory = [];
    this.status = GameStatus.ACTIVE;

    // Restore game mode and AI color
    this.gameMode = currentGameMode;
    this.aiColor = currentAIColor;

    // If in AI mode and AI plays as white, make the first move
    if (this.gameMode === GameMode.HUMAN_VS_AI && 
        this.aiColor === PieceColor.WHITE && 
        this.status === GameStatus.ACTIVE) {
      // Call makeAIMove and handle the promise
      this.makeAIMove(callback).then(result => {
        if (!result) {
          console.error('AI move failed');
        }
      }).catch(error => {
        console.error('AI move error:', error);
      });
    }
  }

  public getPossibleMoves(position: Position): Position[] {
    const piece = this.board.getPieceAt(position);
    if (!piece || piece.color !== this.currentPlayer) {
      return [];
    }

    const possibleMoves: Position[] = [];
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const to = { x, y };
        if (this.moveValidator.isValidMove(position, to, this.currentPlayer)) {
          possibleMoves.push(to);
        }
      }
    }

    return possibleMoves;
  }
}
