import { Board } from './Board';
import { MoveValidator } from './MoveValidator';
import { Piece, PieceColor, Position, Move, GameStatus } from './types';

export class Game {
  private board: Board;
  private moveValidator: MoveValidator;
  private currentPlayer: PieceColor;
  private moveHistory: Move[];
  private status: GameStatus;

  constructor() {
    this.board = new Board();
    this.moveValidator = new MoveValidator(this.board);
    this.currentPlayer = PieceColor.WHITE; // White starts
    this.moveHistory = [];
    this.status = GameStatus.ACTIVE;
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

  public makeMove(from: Position, to: Position): boolean {
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

    return true;
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

  public resetGame(): void {
    this.board.resetBoard();
    this.currentPlayer = PieceColor.WHITE;
    this.moveHistory = [];
    this.status = GameStatus.ACTIVE;
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