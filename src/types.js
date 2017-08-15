// @flow

export type Grid = {|
  solved: boolean,
  length: number,
  blocks: Array<Block>
|}

export type Block = {|
  blockIndex: number,
  cells: Array<Cell>
|}

export type Cell = {|
  blockIndex: number,
  cellIndex: number,
  possibilities: Array<number>,
  passes: number,
  guess?: number
|}
