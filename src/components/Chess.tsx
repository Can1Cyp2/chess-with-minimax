import { useEffect, useRef, useState } from "react";
import { PieceType, PositionType } from "../data/interfaces";
import { BOARD_SIZE, colors, STARTING_POSITION } from "../data/properties";
import getAvailableMoves from "../helpers/getAvailableMoves";
import { getAllMoves, getBestMove } from "../helpers/minimax";
import nextId from "../helpers/nextId";
import useKeybind from "../hooks/useKeybind";
import useWidth from "../hooks/useWidth";
import Piece from "./Piece";
import Square from "./Square";

export default function Chess() {
  // ~~~ HOOKS ~~~ \\
  useWidth();
  useKeybind("Escape", () => setSelectedPiece(undefined));

  // ~~~ STATES ~~~ \\
  const [board, setBoard] = useState(STARTING_POSITION);
  const [squareElements, setSquareElements] = useState<any>([]);
  const [selectedPiece, setSelectedPiece] = useState<PositionType>();
  const [availableMoves, setAvailableMoves] = useState<PositionType[]>([]);
  const [whosTurn, setWhosTurn] = useState<0 | 1>(0); // 0 = white, 1 = black
  const [timeToCompleteAIMove, setTimeToCompleteAIMove] = useState<number>(0);

  // ~~~ REFS ~~~ \\
  const boardRef = useRef<HTMLDivElement>(null);

  // ~~~ INITIALIZE BOARD ~~~ \\
  useEffect(() => {
    let key = 0;
    const squareElements: any[] = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        let color = (i + j) % 2 === 0 ? colors.light : colors.dark;

        let isOvertakeSquare = false;
        let isAvailableSquare = false;

        availableMoves.forEach((move: PositionType) => {
          if (move.x === j && move.y === i) {
            isAvailableSquare = true;
            // Check if the square is an overtake square (if there is a piece on it that is not the same team as the selected piece)

            if (board[i][j]) {
              if (whosTurn === 0 && board[i][j].toLowerCase() !== board[i][j]) isOvertakeSquare = true;
              else if (whosTurn === 1 && board[i][j].toUpperCase() !== board[i][j]) isOvertakeSquare = true;
            }
          }
        });

        squareElements.push(
          <Square
            key={key}
            color={color}
            onClick={clickSquareToMove}
            x={i}
            y={j}
            isOvertakeSquare={isOvertakeSquare}
            isAvailableSquare={isAvailableSquare}
          />
        );
        key++;
      }
    }

    setSquareElements(squareElements);
  }, [availableMoves]);

  // ~~~ AVAILABLE MOVES ~~~ \\
  useEffect(() => {
    setAvailableMoves(
      selectedPiece
        ? getAvailableMoves(board, board[selectedPiece!.y][selectedPiece!.x], selectedPiece?.x, selectedPiece?.y)
        : []
    );
  }, [selectedPiece]);

  // ~~~ HANDLE AI MOVES ~~~ \\
  useEffect(() => {
    setTimeout(() => {
      // If it's not the AI's turn, return
      if (whosTurn === 0) return;

      const move = getBestMove(board);
      if (move.from.x === -1) return;

      moveFrom(move.from.x, move.from.y, move.to.x, move.to.y);

      // Switch turns
      setWhosTurn((whosTurn) => (whosTurn === 0 ? 1 : 0));

      setTimeToCompleteAIMove(move.timeToComplete ? move.timeToComplete : 0);
    }, 50);
  }, [whosTurn]);

  // ~~~ ELEMENTS ~~~ \\
  const pieceElements = board.map((row, i) => {
    return row.map((piece, j) => {
      return piece ? (
        <Piece
          id={nextId()}
          key={nextId()}
          x={j}
          y={i}
          team={piece === piece.toUpperCase() ? 1 : 0}
          type={piece.toLowerCase()}
          width={boardRef.current?.offsetWidth || null}
          setSelectedPiece={setSelectedPiece}
          onClick={handlePieceClick}
        />
      ) : null;
    });
  });

  // ~~~ FUNCTIONS ~~~ \\
  function clickSquareToMove(y: number, x: number) {
    if (!selectedPiece) return;

    // If the selected square is an available move, move the piece there
    for (let i = 0; i < availableMoves.length; i++) {
      if (availableMoves[i].x === x && availableMoves[i].y === y) {
        // const newBoard = [...board];
        // newBoard[y][x] = board[selectedPiece!.y][selectedPiece!.x];
        // newBoard[selectedPiece!.y][selectedPiece!.x] = "";
        moveFrom(selectedPiece!.x, selectedPiece!.y, x, y);

        // Update state
        // setBoard(newBoard);
        setSelectedPiece(undefined);
        setWhosTurn((whosTurn) => (whosTurn === 0 ? 1 : 0));
      }
    }

    // If the selected square is not an available move, deselect the piece
    setSelectedPiece(undefined);
  }

  function moveFrom(x1: number, y1: number, x2: number, y2: number) {
    // Play audio
    const audio =
      board[y2][x2] === ""
        ? new Audio("../../src/assets/sounds/move-self.mp3")
        : new Audio("../../src/assets/sounds/capture.mp3");
    audio.play();

    const newBoard = [...board];
    newBoard[y2][x2] = board[y1][x1];
    newBoard[y1][x1] = "";
    setBoard(newBoard);
    setSelectedPiece(undefined);
  }

  function handlePieceClick(piece: PieceType) {
    if (piece.team === whosTurn) {
      setSelectedPiece({ x: piece.x, y: piece.y });
      return;
    }

    for (let i = 0; i < availableMoves.length; i++) {
      if (availableMoves[i].x === piece.x && availableMoves[i].y === piece.y) {
        moveFrom(selectedPiece!.x, selectedPiece!.y, piece.x, piece.y);
        setWhosTurn(whosTurn === 0 ? 1 : 0);
      }
    }
  }

  // ~~~ RENDER ~~~ \\
  return (
    <div
      ref={boardRef}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        width: "min(100%, 800px)",
      }}
    >
      {pieceElements}
      {squareElements}
      <div style={{ gridColumn: "1 / -1", textAlign: "center", fontSize: "3rem" }}>
        {whosTurn === 0 ? "White's turn" : "Black's turn"}
        <br />
        {timeToCompleteAIMove > 0 ? `AI took ${timeToCompleteAIMove}ms to think` : null}
      </div>
    </div>
  );
}
