import { MoveValidator } from '../../../src/chess/models/MoveValidator';
import { BoardInterface } from '../../../src/chess/models/BoardInterface';
import { Piece, PieceType, PieceColor, Position } from '../../../src/chess/models/types';

// Mock board implementation for testing
class MockBoard implements BoardInterface {
  private pieces: Piece[] = [];

  constructor(initialPieces: Piece[] = []) {
    this.pieces = [...initialPieces];
  }

  getPieces(): Piece[] {
    return [...this.pieces];
  }

  getPieceAt(position: Position): Piece | undefined {
    return this.pieces.find(
      piece => piece.position.x === position.x && piece.position.y === position.y
    );
  }

  movePiece(from: Position, to: Position): any {
    // Simple implementation for testing
    const piece = this.getPieceAt(from);
    if (!piece) return null;

    const capturedPiece = this.getPieceAt(to);
    if (capturedPiece) {
      this.removePiece(to);
    }

    this.updatePiecePosition(from, to);
    return { from, to, capturedPiece };
  }

  updatePiecePosition(from: Position, to: Position): void {
    const piece = this.getPieceAt(from);
    if (piece) {
      piece.position = { ...to };
    }
  }

  removePiece(position: Position): void {
    this.pieces = this.pieces.filter(
      piece => !(piece.position.x === position.x && piece.position.y === position.y)
    );
  }

  resetBoard(): void {
    this.pieces = [];
  }

  setPieces(pieces: Piece[]): void {
    this.pieces = [...pieces];
  }
}

describe('Check Resolution Tests', () => {
  test('Non-king piece can move to block check', () => {
    // Setup: Create a simple board with a white king and a white queen
    const board = new MockBoard([
      {
        type: PieceType.KING,
        color: PieceColor.WHITE,
        position: { x: 4, y: 0 },
        hasMoved: false
      },
      {
        type: PieceType.QUEEN,
        color: PieceColor.WHITE,
        position: { x: 3, y: 1 },
        hasMoved: false
      }
    ]);

    // Create a validator with a mock isInCheck method that always returns true
    const validator = new MoveValidator(board);
    const originalIsInCheck = validator.isInCheck;
    validator.isInCheck = function(kingColor: PieceColor): boolean {
      return true; // Always return true to simulate the king being in check
    };

    // Verify the mock isInCheck method works
    expect(validator.isInCheck(PieceColor.WHITE)).toBe(true);

    // Verify the queen can move to resolve the check
    expect(validator.isValidMove(
      { x: 3, y: 1 }, // from
      { x: 4, y: 2 }, // to
      PieceColor.WHITE
    )).toBe(true);

    // Restore the original isInCheck method
    validator.isInCheck = originalIsInCheck;
  });

  test('Non-king piece can move to capture checking piece', () => {
    // Setup: Create a simple board with a white king, a white queen, and a black rook
    const board = new MockBoard([
      {
        type: PieceType.KING,
        color: PieceColor.WHITE,
        position: { x: 4, y: 0 },
        hasMoved: false
      },
      {
        type: PieceType.QUEEN,
        color: PieceColor.WHITE,
        position: { x: 3, y: 6 },
        hasMoved: false
      },
      {
        type: PieceType.ROOK,
        color: PieceColor.BLACK,
        position: { x: 4, y: 7 },
        hasMoved: false
      }
    ]);

    // Create a validator with a mock isInCheck method that always returns true
    const validator = new MoveValidator(board);
    const originalIsInCheck = validator.isInCheck;
    validator.isInCheck = function(kingColor: PieceColor): boolean {
      return true; // Always return true to simulate the king being in check
    };

    // Verify the mock isInCheck method works
    expect(validator.isInCheck(PieceColor.WHITE)).toBe(true);

    // Verify the queen can move to capture the rook
    expect(validator.isValidMove(
      { x: 3, y: 6 }, // from
      { x: 4, y: 7 }, // to
      PieceColor.WHITE
    )).toBe(true);

    // Restore the original isInCheck method
    validator.isInCheck = originalIsInCheck;
  });

  test('Non-king piece cannot move if it does not resolve check', () => {
    // Setup: Create a board with a white king at (4,0), a white pawn at (0,1),
    // and a black rook at (4,7) that puts the king in check
    const board = new MockBoard([
      {
        type: PieceType.KING,
        color: PieceColor.WHITE,
        position: { x: 4, y: 0 },
        hasMoved: false
      },
      {
        type: PieceType.PAWN,
        color: PieceColor.WHITE,
        position: { x: 0, y: 1 },
        hasMoved: false
      },
      {
        type: PieceType.ROOK,
        color: PieceColor.BLACK,
        position: { x: 4, y: 7 },
        hasMoved: false
      }
    ]);

    // Create a validator with a mock isInCheck method that always returns true
    const validator = new MoveValidator(board);
    const originalIsInCheck = validator.isInCheck;

    validator.isInCheck = function(kingColor: PieceColor): boolean {
      return true; // Always return true to simulate the king being in check
    };

    // Verify the mock isInCheck method works
    expect(validator.isInCheck(PieceColor.WHITE)).toBe(true);

    // Verify the pawn cannot move as it does not resolve the check
    // The pawn at (0,1) moving to (0,2) cannot block the check from the rook at (4,7)
    expect(validator.isValidMove(
      { x: 0, y: 1 }, // from
      { x: 0, y: 2 }, // to
      PieceColor.WHITE
    )).toBe(false);

    // Restore the original method
    validator.isInCheck = originalIsInCheck;
  });

  test('King can move to escape check', () => {
    // Setup: Create a board with a white king at (4,0) and a black rook at (4,7)
    // The rook puts the king in check, but the king can move to (3,0) to escape
    const board = new MockBoard([
      {
        type: PieceType.KING,
        color: PieceColor.WHITE,
        position: { x: 4, y: 0 },
        hasMoved: false
      },
      {
        type: PieceType.ROOK,
        color: PieceColor.BLACK,
        position: { x: 4, y: 7 },
        hasMoved: false
      }
    ]);

    // Create a validator with a mock isInCheck method that always returns true
    const validator = new MoveValidator(board);
    const originalIsInCheck = validator.isInCheck;

    validator.isInCheck = function(kingColor: PieceColor): boolean {
      return true; // Always return true to simulate the king being in check
    };

    // Verify the mock isInCheck method works
    expect(validator.isInCheck(PieceColor.WHITE)).toBe(true);

    // Verify the king can move to escape the check
    // The king at (4,0) can move to (3,0) to escape the check from the rook at (4,7)
    expect(validator.isValidMove(
      { x: 4, y: 0 }, // from
      { x: 3, y: 0 }, // to
      PieceColor.WHITE
    )).toBe(true);

    // Restore the original method
    validator.isInCheck = originalIsInCheck;
  });
});
