import { MoveValidator } from '../../../src/chess/models/MoveValidator';
import { BoardInterface } from '../../../src/chess/models/BoardInterface';
import { Piece, PieceType, PieceColor, Position } from '../../../src/chess/models/types';

// Mock implementation of BoardInterface for testing
class MockBoard implements BoardInterface {
  private pieces: Piece[] = [];

  constructor(pieces: Piece[] = []) {
    this.pieces = [...pieces];
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

describe('MoveValidator', () => {
  // Test pawn movement rules
  describe('Pawn Rules', () => {
    test('White pawn can move one square forward', () => {
      const board = new MockBoard([
        {
          type: PieceType.PAWN,
          color: PieceColor.WHITE,
          position: { x: 0, y: 1 },
          hasMoved: false
        }
      ]);
      const validator = new MoveValidator(board);

      expect(validator.isValidMove(
        { x: 0, y: 1 }, // from
        { x: 0, y: 2 }, // to
        PieceColor.WHITE
      )).toBe(true);
    });

    test('White pawn can move two squares forward from starting position', () => {
      const board = new MockBoard([
        {
          type: PieceType.PAWN,
          color: PieceColor.WHITE,
          position: { x: 0, y: 1 },
          hasMoved: false
        }
      ]);
      const validator = new MoveValidator(board);

      expect(validator.isValidMove(
        { x: 0, y: 1 }, // from
        { x: 0, y: 3 }, // to
        PieceColor.WHITE
      )).toBe(true);
    });

    test('White pawn can capture en passant - black pawn just moved two squares', () => {
      const board = new MockBoard([
        {
          type: PieceType.PAWN,
          color: PieceColor.WHITE,
          position: { x: 1, y: 4 },
          hasMoved: true
        },
        {
          type: PieceType.PAWN,
          color: PieceColor.BLACK,
          position: { x: 2, y: 4 },
          hasMoved: true // Black pawn has moved from starting position
        }
      ]);
      const validator = new MoveValidator(board);

      // White pawn at (1,4) captures black pawn at (2,4) en passant, moving to (2,5)
      expect(validator.isValidMove(
        { x: 1, y: 4 }, // from
        { x: 2, y: 5 }, // to
        PieceColor.WHITE
      )).toBe(true);
    });

    test('Black pawn can capture en passant - white pawn just moved two squares', () => {
      const board = new MockBoard([
        {
          type: PieceType.PAWN,
          color: PieceColor.BLACK,
          position: { x: 1, y: 3 },
          hasMoved: true
        },
        {
          type: PieceType.PAWN,
          color: PieceColor.WHITE,
          position: { x: 2, y: 3 },
          hasMoved: true // White pawn has moved from starting position
        }
      ]);
      const validator = new MoveValidator(board);

      // Black pawn at (1,3) captures white pawn at (2,3) en passant, moving to (2,2)
      expect(validator.isValidMove(
        { x: 1, y: 3 }, // from
        { x: 2, y: 2 }, // to
        PieceColor.BLACK
      )).toBe(true);
    });

    test('En passant is not valid if the enemy pawn is not on the correct rank', () => {
      const board = new MockBoard([
        {
          type: PieceType.PAWN,
          color: PieceColor.WHITE,
          position: { x: 1, y: 5 }, // Not on the 5th rank
          hasMoved: true
        },
        {
          type: PieceType.PAWN,
          color: PieceColor.BLACK,
          position: { x: 2, y: 5 },
          hasMoved: true
        }
      ]);
      const validator = new MoveValidator(board);

      // White pawn at (1,5) tries to capture black pawn at (2,5) en passant, moving to (2,6)
      expect(validator.isValidMove(
        { x: 1, y: 5 }, // from
        { x: 2, y: 6 }, // to
        PieceColor.WHITE
      )).toBe(false);
    });

    test('En passant is not valid if there is no pawn to capture', () => {
      const board = new MockBoard([
        {
          type: PieceType.PAWN,
          color: PieceColor.WHITE,
          position: { x: 1, y: 4 },
          hasMoved: true
        }
        // No black pawn at (2,4)
      ]);
      const validator = new MoveValidator(board);

      // White pawn at (1,4) tries to capture en passant, but there's no pawn to capture
      expect(validator.isValidMove(
        { x: 1, y: 4 }, // from
        { x: 2, y: 5 }, // to
        PieceColor.WHITE
      )).toBe(false);
    });

    test('En passant is not valid if the capturing pawn is not on the correct rank', () => {
      const board = new MockBoard([
        {
          type: PieceType.PAWN,
          color: PieceColor.WHITE,
          position: { x: 1, y: 3 }, // Not on the 5th rank (4 in 0-indexed)
          hasMoved: true
        },
        {
          type: PieceType.PAWN,
          color: PieceColor.BLACK,
          position: { x: 2, y: 3 },
          hasMoved: true
        }
      ]);
      const validator = new MoveValidator(board);

      // White pawn at (1,3) tries to capture black pawn at (2,3) en passant, moving to (2,4)
      expect(validator.isValidMove(
        { x: 1, y: 3 }, // from
        { x: 2, y: 4 }, // to
        PieceColor.WHITE
      )).toBe(false);
    });

    test('En passant is not valid if the piece to capture is not a pawn', () => {
      const board = new MockBoard([
        {
          type: PieceType.PAWN,
          color: PieceColor.WHITE,
          position: { x: 1, y: 4 },
          hasMoved: true
        },
        {
          type: PieceType.KNIGHT, // Not a pawn
          color: PieceColor.BLACK,
          position: { x: 2, y: 4 }
        }
      ]);
      const validator = new MoveValidator(board);

      // White pawn at (1,4) tries to capture black knight at (2,4) en passant, moving to (2,5)
      expect(validator.isValidMove(
        { x: 1, y: 4 }, // from
        { x: 2, y: 5 }, // to
        PieceColor.WHITE
      )).toBe(false);
    });
  });

  // Test knight movement rules
  describe('Knight Rules', () => {
    test('Knight can move in L-shape', () => {
      const board = new MockBoard([
        {
          type: PieceType.KNIGHT,
          color: PieceColor.WHITE,
          position: { x: 1, y: 0 }
        }
      ]);
      const validator = new MoveValidator(board);

      // Valid knight moves from (1, 0)
      expect(validator.isValidMove({ x: 1, y: 0 }, { x: 0, y: 2 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 1, y: 0 }, { x: 2, y: 2 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 1, y: 0 }, { x: 3, y: 1 }, PieceColor.WHITE)).toBe(true);
    });

    test('Knight cannot move to invalid positions', () => {
      const board = new MockBoard([
        {
          type: PieceType.KNIGHT,
          color: PieceColor.WHITE,
          position: { x: 1, y: 0 }
        }
      ]);
      const validator = new MoveValidator(board);

      // Invalid knight moves
      expect(validator.isValidMove({ x: 1, y: 0 }, { x: 1, y: 1 }, PieceColor.WHITE)).toBe(false);
      expect(validator.isValidMove({ x: 1, y: 0 }, { x: 2, y: 0 }, PieceColor.WHITE)).toBe(false);
      expect(validator.isValidMove({ x: 1, y: 0 }, { x: 3, y: 3 }, PieceColor.WHITE)).toBe(false);
    });
  });

  // Test bishop movement rules
  describe('Bishop Rules', () => {
    test('Bishop can move diagonally', () => {
      const board = new MockBoard([
        {
          type: PieceType.BISHOP,
          color: PieceColor.WHITE,
          position: { x: 2, y: 0 }
        }
      ]);
      const validator = new MoveValidator(board);

      // Valid bishop moves
      expect(validator.isValidMove({ x: 2, y: 0 }, { x: 0, y: 2 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 2, y: 0 }, { x: 4, y: 2 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 2, y: 0 }, { x: 5, y: 3 }, PieceColor.WHITE)).toBe(true);
    });

    test('Bishop cannot move non-diagonally', () => {
      const board = new MockBoard([
        {
          type: PieceType.BISHOP,
          color: PieceColor.WHITE,
          position: { x: 2, y: 0 }
        }
      ]);
      const validator = new MoveValidator(board);

      // Invalid bishop moves
      expect(validator.isValidMove({ x: 2, y: 0 }, { x: 2, y: 2 }, PieceColor.WHITE)).toBe(false);
      expect(validator.isValidMove({ x: 2, y: 0 }, { x: 4, y: 1 }, PieceColor.WHITE)).toBe(false);
    });

    test('Bishop cannot move through pieces', () => {
      const board = new MockBoard([
        {
          type: PieceType.BISHOP,
          color: PieceColor.WHITE,
          position: { x: 2, y: 0 }
        },
        {
          type: PieceType.PAWN,
          color: PieceColor.WHITE,
          position: { x: 3, y: 1 },
          hasMoved: false
        }
      ]);
      const validator = new MoveValidator(board);

      // Bishop blocked by own pawn
      expect(validator.isValidMove({ x: 2, y: 0 }, { x: 4, y: 2 }, PieceColor.WHITE)).toBe(false);
    });
  });

  // Test rook movement rules
  describe('Rook Rules', () => {
    test('Rook can move horizontally and vertically', () => {
      const board = new MockBoard([
        {
          type: PieceType.ROOK,
          color: PieceColor.WHITE,
          position: { x: 0, y: 0 },
          hasMoved: false
        }
      ]);
      const validator = new MoveValidator(board);

      // Valid rook moves
      expect(validator.isValidMove({ x: 0, y: 0 }, { x: 0, y: 7 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 0, y: 0 }, { x: 7, y: 0 }, PieceColor.WHITE)).toBe(true);
    });

    test('Rook cannot move diagonally', () => {
      const board = new MockBoard([
        {
          type: PieceType.ROOK,
          color: PieceColor.WHITE,
          position: { x: 0, y: 0 },
          hasMoved: false
        }
      ]);
      const validator = new MoveValidator(board);

      // Invalid rook moves
      expect(validator.isValidMove({ x: 0, y: 0 }, { x: 1, y: 1 }, PieceColor.WHITE)).toBe(false);
    });
  });

  // Test queen movement rules
  describe('Queen Rules', () => {
    test('Queen can move horizontally, vertically, and diagonally', () => {
      const board = new MockBoard([
        {
          type: PieceType.QUEEN,
          color: PieceColor.WHITE,
          position: { x: 3, y: 0 }
        }
      ]);
      const validator = new MoveValidator(board);

      // Valid queen moves - horizontal and vertical (like a rook)
      expect(validator.isValidMove({ x: 3, y: 0 }, { x: 3, y: 7 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 3, y: 0 }, { x: 7, y: 0 }, PieceColor.WHITE)).toBe(true);

      // Valid queen moves - diagonal (like a bishop)
      expect(validator.isValidMove({ x: 3, y: 0 }, { x: 0, y: 3 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 3, y: 0 }, { x: 6, y: 3 }, PieceColor.WHITE)).toBe(true);
    });

    test('Queen cannot move in L-shape (like a knight)', () => {
      const board = new MockBoard([
        {
          type: PieceType.QUEEN,
          color: PieceColor.WHITE,
          position: { x: 3, y: 0 }
        }
      ]);
      const validator = new MoveValidator(board);

      // Invalid queen moves
      expect(validator.isValidMove({ x: 3, y: 0 }, { x: 1, y: 1 }, PieceColor.WHITE)).toBe(false);
      expect(validator.isValidMove({ x: 3, y: 0 }, { x: 5, y: 1 }, PieceColor.WHITE)).toBe(false);
    });

    test('Queen cannot move through pieces', () => {
      const board = new MockBoard([
        {
          type: PieceType.QUEEN,
          color: PieceColor.WHITE,
          position: { x: 3, y: 0 }
        },
        {
          type: PieceType.PAWN,
          color: PieceColor.WHITE,
          position: { x: 3, y: 1 },
          hasMoved: false
        }
      ]);
      const validator = new MoveValidator(board);

      // Queen blocked by own pawn
      expect(validator.isValidMove({ x: 3, y: 0 }, { x: 3, y: 3 }, PieceColor.WHITE)).toBe(false);
    });
  });

  // Test king movement rules
  describe('King Rules', () => {
    test('King can move one square in any direction', () => {
      const board = new MockBoard([
        {
          type: PieceType.KING,
          color: PieceColor.WHITE,
          position: { x: 4, y: 0 },
          hasMoved: false
        }
      ]);
      const validator = new MoveValidator(board);

      // Valid king moves - one square in any direction
      expect(validator.isValidMove({ x: 4, y: 0 }, { x: 3, y: 0 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 4, y: 0 }, { x: 5, y: 0 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 4, y: 0 }, { x: 4, y: 1 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 4, y: 0 }, { x: 3, y: 1 }, PieceColor.WHITE)).toBe(true);
      expect(validator.isValidMove({ x: 4, y: 0 }, { x: 5, y: 1 }, PieceColor.WHITE)).toBe(true);
    });

    test('King cannot move more than one square', () => {
      const board = new MockBoard([
        {
          type: PieceType.KING,
          color: PieceColor.WHITE,
          position: { x: 4, y: 0 },
          hasMoved: false
        }
      ]);
      const validator = new MoveValidator(board);

      // Invalid king moves - more than one square
      expect(validator.isValidMove({ x: 4, y: 0 }, { x: 4, y: 2 }, PieceColor.WHITE)).toBe(false);
      expect(validator.isValidMove({ x: 4, y: 0 }, { x: 6, y: 0 }, PieceColor.WHITE)).toBe(false);
      expect(validator.isValidMove({ x: 4, y: 0 }, { x: 6, y: 2 }, PieceColor.WHITE)).toBe(false);
    });

    test('King can castle kingside', () => {
      const board = new MockBoard([
        {
          type: PieceType.KING,
          color: PieceColor.WHITE,
          position: { x: 4, y: 0 },
          hasMoved: false
        },
        {
          type: PieceType.ROOK,
          color: PieceColor.WHITE,
          position: { x: 7, y: 0 },
          hasMoved: false
        }
      ]);
      const validator = new MoveValidator(board);

      // Kingside castling
      expect(validator.isValidMove({ x: 4, y: 0 }, { x: 6, y: 0 }, PieceColor.WHITE)).toBe(true);
    });

    test('King cannot castle if it has moved', () => {
      const board = new MockBoard([
        {
          type: PieceType.KING,
          color: PieceColor.WHITE,
          position: { x: 4, y: 0 },
          hasMoved: true
        },
        {
          type: PieceType.ROOK,
          color: PieceColor.WHITE,
          position: { x: 7, y: 0 },
          hasMoved: false
        }
      ]);
      const validator = new MoveValidator(board);

      // Cannot castle if king has moved
      expect(validator.isValidMove({ x: 4, y: 0 }, { x: 6, y: 0 }, PieceColor.WHITE)).toBe(false);
    });
  });
});
