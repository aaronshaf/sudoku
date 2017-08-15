// @flow

import range from 'lodash/range'
import shuffle from 'lodash/shuffle'
import chunk from 'lodash/chunk'
import difference from 'lodash/difference'
import union from 'lodash/union'
import type { Grid, Block, Cell } from './types'

// look ma, no mutation (exception: iterations++)

export function generateSudokuGrid(blockLength: number): Grid {
  const blocks = range(
    0,
    blockLength * blockLength
  ).map((blockIndex): Block => {
    return {
      blockIndex,
      cells: range(0, blockLength * blockLength).map((cellIndex): Cell => {
        return {
          blockIndex,
          cellIndex,
          possibilities: range(1, blockLength * blockLength + 1),
          guess: undefined,
          passes: 0
        }
      })
    }
  })
  return {
    solved: false,
    length: blockLength,
    blocks
  }
}

export function getOtherCellsInRow(grid: Grid, currentCell: Cell): Array<Cell> {
  const blockChunkIndex = Math.floor(currentCell.blockIndex / grid.length)
  const cellChunkIndex = Math.floor(currentCell.cellIndex / grid.length)
  return chunk(grid.blocks, grid.length)[
    blockChunkIndex
  ].reduce((otherCellsInRow, block) => {
    return otherCellsInRow.concat(
      chunk(block.cells, grid.length)[cellChunkIndex].filter(
        cell => cell !== currentCell
      )
    )
  }, [])
}

export function getOtherCellsInColumn(
  grid: Grid,
  currentCell: Cell
): Array<Cell> {
  const blockChunkIndex = Math.floor(currentCell.blockIndex % grid.length)
  const cellChunkIndex = Math.floor(currentCell.cellIndex % grid.length)
  const result = chunk(grid.blocks, grid.length)
    .map(chunk => chunk[blockChunkIndex])
    .reduce((otherCellsInColumn, block) => {
      return otherCellsInColumn.concat(
        chunk(block.cells, grid.length)
          .map(chunk => chunk[cellChunkIndex])
          .filter(cell => cell !== currentCell)
      )
    }, [])
  return result
}

export function getExistingRelatedGuess(grid: Grid, cell: Cell) {
  const cellsInBlock = grid.blocks[cell.blockIndex].cells
  const cellsInRow = getOtherCellsInRow(grid, cell)
  const cellsInColumn = getOtherCellsInColumn(grid, cell)
  const guesses = []
    .concat(cellsInBlock, cellsInRow, cellsInColumn)
    .filter(hasGuess)
    .map(cell => cell.guess)
  return union(guesses)
}

export function getPossibleValuesForCell(
  grid: Grid,
  cell: Cell
): Array<number> {
  const allPossibleValues = range(1, grid.length * grid.length + 1)
  const existingGuesses = getExistingRelatedGuess(grid, cell)
  const possibleValues = difference(allPossibleValues, existingGuesses)
  return possibleValues
}

export function finishSudokuGrid(grid: Grid): Grid {
  let iterations = 0
  while (grid.solved === false) {
    grid = solveSudokuGrid(grid)
    iterations++
  }
  console.info(`iterations: ${iterations}`)
  return grid
}

export function solveSudokuGrid(grid: Grid) {
  if (grid.solved === true) {
    return grid
  }
  grid = updatePossibilities(grid)
  const cell = findNextCellToGuess(grid)
  if (typeof cell === 'undefined') {
    return {
      solved: true,
      length: grid.length,
      blocks: grid.blocks
    }
  }
  if (cell.possibilities.length === 0) {
    return {
      solved: false,
      length: grid.length,
      blocks: grid.blocks.map(block => {
        if (block.blockIndex === cell.blockIndex) {
          return {
            ...block,
            cells: block.cells.map(_cell => {
              return {
                ..._cell,
                guess: undefined,
                passes: 0
              }
            })
          }
        }
        // Cheap backtracking, but it works
        if (Math.random() < 0.05) {
          return {
            ...block,
            cells: block.cells.map(_cell => {
              return {
                ..._cell,
                guess: undefined,
                passes: 0
              }
            })
          }
        }
        return block
      })
    }
  }
  return {
    solved: false,
    length: grid.length,
    blocks: grid.blocks.map(block => {
      if (block.blockIndex === cell.blockIndex) {
        return {
          ...block,
          cells: block.cells.map(_cell => {
            if (_cell === cell) {
              return {
                ...cell,
                guess: shuffle(cell.possibilities)[0],
                passes: cell.passes + 1
              }
            }
            return _cell
          })
        }
      }
      return block
    })
  }
}

export function getAllCells(grid: Grid): Array<Cell> {
  return grid.blocks.reduce((cells, block) => {
    return cells.concat(block.cells)
  }, [])
}

export function findObviousCellToGuess(grid: Grid): ?Cell {
  return getAllCells(grid).find(cell => {
    if (typeof cell.guess === 'number') {
      return false
    }
    const cellsInBlock = grid.blocks[cell.blockIndex].cells.filter(hasGuess)
    const cellsInRow = getOtherCellsInRow(grid, cell).filter(hasGuess)
    const cellsInColumn = getOtherCellsInColumn(grid, cell).filter(hasGuess)
    const magicNumber = grid.length * grid.length - 1
    return (
      cellsInBlock.length === magicNumber ||
      cellsInRow.length === magicNumber ||
      cellsInColumn.length === magicNumber
    )
  })
}

export function updatePossibilities(grid: Grid): Grid {
  return {
    solved: grid.solved,
    length: grid.length,
    blocks: grid.blocks.map(block => {
      return {
        ...block,
        cells: block.cells.map(cell => {
          if (typeof cell.guess === 'number') {
            return cell
          }
          return {
            ...cell,
            possibilities: getPossibleValuesForCell(grid, cell)
          }
        })
      }
    })
  }
}

export function findNextCellToGuess(grid: Grid): Cell {
  const obviousCell = findObviousCellToGuess(grid)
  if (obviousCell) {
    return obviousCell
  }
  const candidates = getAllCells(grid).reduce((leastConstrainedCells, cell) => {
    if (typeof cell.guess === 'number') {
      return leastConstrainedCells
    }
    if (leastConstrainedCells.length === 0) {
      return [cell]
    }
    if (
      cell.possibilities.length < leastConstrainedCells[0].possibilities.length
    ) {
      return [cell]
    }
    if (
      cell.possibilities.length ===
      leastConstrainedCells[0].possibilities.length
    ) {
      return leastConstrainedCells.concat(cell)
    }
    return leastConstrainedCells
  }, [])

  return shuffle(candidates)[0]
}

export function hasGuess(cell: Cell) {
  return typeof cell.guess === 'number'
}
