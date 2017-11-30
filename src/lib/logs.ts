let walkSync = require('walk-sync')
let Table = require('table')

import Utils from './utils'
import Status from './status'
import Config from './Config'

let path = Config.getSavePath()

let getAllFilesName = function (): string[] {
  let outputArray = ['']
  let files = walkSync.entries(path, { globs: ['**/*.md']})
  files.forEach( function (file) {
    let fileName = file.relativePath

    let index = Utils.getIndexByString(fileName)
    if (index) {
      outputArray[index] = fileName
    }
  })

  return outputArray
}

function createLogsHeader (allStatus: string[]): string[] {
  let tableHeader: string[] = []

  let currentStatus = allStatus[0]
  let splitCurrentStatus = currentStatus.split(' ')

  for (let i = 0; i < splitCurrentStatus.length; i++) {
    tableHeader.push(' - ')
  }

  return tableHeader
}
function createLogsBody (allStatus: string[], tableData: string[][]): string[][] {
  for (let i = 0; i < allStatus.length; i++) {
    let tableHeader: string[] = []
    let currentStatus = allStatus[i]
    let splitCurrentStatus = currentStatus.split(' ')
    for (let i = 0; i < splitCurrentStatus.length; i++) {
      tableHeader.push(splitCurrentStatus[i])
    }
    tableData.push(tableHeader)
  }
  return tableData
}

export function logs (index): string {
  let outputArray = getAllFilesName()
  let currentFileName = outputArray[index]
  let filePath = path + currentFileName
  let allStatus = Status.getAllStatus(filePath)
  if (allStatus.length === 0) {
    console.log('no status: did .adr.json config has correct config of language??')
    return ''
  }
  let tableData: string[][] = []

  let tableHeader = createLogsHeader(allStatus)
  tableData.push(tableHeader)
  createLogsBody(allStatus, tableData)
  let output = Table.table(tableData)

  console.log(output)
  return output
}
