import { Piece, PieceType, PieceColor, Position, Move } from './types';
import { BoardInterface } from './BoardInterface';

export class Board implements BoardInterface {
  private pieces: Piece[] = [];

  constructor() {
    this.resetBoard();
  }

  public getPieces(): Piece[] {
    return [...this.pieces];
  }

  public getPieceAt(position: Position): Piece | undefined {
    return this.pieces.find(
      piece => piece.position.x === position.x && piece.position.y === position.y
    );
  }

  public movePiece(from: Position, to: Position): Move | null {
    const piece = this.getPieceAt(from);
    if (!piece) return null;

    const capturedPiece = this.getPieceAt(to);

    // Create the move object
    const move: Move = {
      from,
      to,
      capturedPiece
    };

    // Handle special moves
    if (piece.type === PieceType.PAWN) {
      // En passant
      if (Math.abs(from.x - to.x) === 1 && Math.abs(from.y - to.y) === 1 && !capturedPiece) {
        const enPassantPiecePos = { x: to.x, y: from.y };
        const enPassantPiece = this.getPieceAt(enPassantPiecePos);
        if (enPassantPiece && enPassantPiece.type === PieceType.PAWN) {
          move.capturedPiece = enPassantPiece;
          move.isEnPassant = true;
          this.removePiece(enPassantPiecePos);
        }
      }

      // Promotion
      if ((piece.color === PieceColor.WHITE && to.y === 7) || 
          (piece.color === PieceColor.BLACK && to.y === 0)) {
        move.promotion = PieceType.QUEEN; // Default promotion to queen
      }
    }

    // Castling
    if (piece.type === PieceType.KING && Math.abs(from.x - to.x) === 2) {
      move.isCastling = true;
      const rookFromX = to.x > from.x ? 7 : 0;
      const rookToX = to.x > from.x ? from.x + 1 : from.x - 1;
      const rookPos = { x: rookFromX, y: from.y };
      const rook = this.getPieceAt(rookPos);

      if (rook && rook.type === PieceType.ROOK) {
        this.updatePiecePosition(rookPos, { x: rookToX, y: from.y });
      }
    }

    // Remove captured piece
    if (capturedPiece && !move.isEnPassant) {
      this.removePiece(to);
    }

    // Update piece position
    this.updatePiecePosition(from, to);

    // Mark piece as moved
    piece.hasMoved = true;

    return move;
  }

  public updatePiecePosition(from: Position, to: Position): void {
    const piece = this.getPieceAt(from);
    if (piece) {
      piece.position = { ...to };
    }
  }

  public removePiece(position: Position): void {
    this.pieces = this.pieces.filter(
      piece => !(piece.position.x === position.x && piece.position.y === position.y)
    );
  }

  public setPieces(pieces: Piece[]): void {
    this.pieces = [...pieces];
  }

  public resetBoard(): void {
    this.pieces = [];

    // Add pawns
    for (let x = 0; x < 8; x++) {
      this.pieces.push({
        type: PieceType.PAWN,
        color: PieceColor.WHITE,
        position: { x, y: 1 },
        hasMoved: false
      });

      this.pieces.push({
        type: PieceType.PAWN,
        color: PieceColor.BLACK,
        position: { x, y: 6 },
        hasMoved: false
      });
    }

    // Add rooks
    this.pieces.push({
      type: PieceType.ROOK,
      color: PieceColor.WHITE,
      position: { x: 0, y: 0 },
      hasMoved: false
    });
    this.pieces.push({
      type: PieceType.ROOK,
      color: PieceColor.WHITE,
      position: { x: 7, y: 0 },
      hasMoved: false
    });
    this.pieces.push({
      type: PieceType.ROOK,
      color: PieceColor.BLACK,
      position: { x: 0, y: 7 },
      hasMoved: false
    });
    this.pieces.push({
      type: PieceType.ROOK,
      color: PieceColor.BLACK,
      position: { x: 7, y: 7 },
      hasMoved: false
    });

    // Add knights
    this.pieces.push({
      type: PieceType.KNIGHT,
      color: PieceColor.WHITE,
      position: { x: 1, y: 0 }
    });
    this.pieces.push({
      type: PieceType.KNIGHT,
      color: PieceColor.WHITE,
      position: { x: 6, y: 0 }
    });
    this.pieces.push({
      type: PieceType.KNIGHT,
      color: PieceColor.BLACK,
      position: { x: 1, y: 7 }
    });
    this.pieces.push({
      type: PieceType.KNIGHT,
      color: PieceColor.BLACK,
      position: { x: 6, y: 7 }
    });

    // Add bishops
    this.pieces.push({
      type: PieceType.BISHOP,
      color: PieceColor.WHITE,
      position: { x: 2, y: 0 }
    });
    this.pieces.push({
      type: PieceType.BISHOP,
      color: PieceColor.WHITE,
      position: { x: 5, y: 0 }
    });
    this.pieces.push({
      type: PieceType.BISHOP,
      color: PieceColor.BLACK,
      position: { x: 2, y: 7 }
    });
    this.pieces.push({
      type: PieceType.BISHOP,
      color: PieceColor.BLACK,
      position: { x: 5, y: 7 }
    });

    // Add queens
    this.pieces.push({
      type: PieceType.QUEEN,
      color: PieceColor.WHITE,
      position: { x: 3, y: 0 }
    });
    this.pieces.push({
      type: PieceType.QUEEN,
      color: PieceColor.BLACK,
      position: { x: 3, y: 7 }
    });

    // Add kings
    this.pieces.push({
      type: PieceType.KING,
      color: PieceColor.WHITE,
      position: { x: 4, y: 0 },
      hasMoved: false
    });
    this.pieces.push({
      type: PieceType.KING,
      color: PieceColor.BLACK,
      position: { x: 4, y: 7 },
      hasMoved: false
    });
  }
}
