let moment = require('moment')
let fs = require('fs')
let walkSync = require('walk-sync')
let toc = require('markdown-toc')
let Remarkable = require('remarkable')

import Utils from './utils'
import Status from './status'
import {GenerateBuilder} from './base/GenerateBuilder'
import {JsonGenerateBuilder} from './base/JsonGenerateBuilder'
import {htmlRender} from './helpers/htmlRender'

let path = Utils.getSavePath()
function buildCsvBodyFun (index, decision, file, bodyString): string[] {
  let lastStatus = Status.getLatestStatus(path + file.relativePath)
  let body = `${index}, ${decision}, ${moment(file.mtime).format('YYYY-MM-DD')}, ${lastStatus}\n`
  return bodyString.push(body)
}

function outputCsv () {
  let path = Utils.getSavePath()
  let i18n = Utils.getI18n()
  let graphGenerate = new GenerateBuilder(path)
  let startString = `Index, ${i18n.decision}, ${i18n.modifiedDate}, ${i18n.lastStatus}\n`
  let results = graphGenerate
    .setStart(startString)
    .setEnd('')
    .setBody(buildCsvBodyFun)
    .build()

  return results
}

function buildJsonBodyFun (index, decision, file, bodyString): string[] {
  let lastStatus = Status.getLatestStatus(path + file.relativePath)
  let body = {
    index: index,
    decision: decision,
    modifiedDate: moment(file.mtime).format('YYYY-MM-DD'),
    lastStatus: lastStatus
  }
  return bodyString.push(body)
}

function outputJson () {
  let path = Utils.getSavePath()
  let graphGenerate = new JsonGenerateBuilder(path)
  let results = graphGenerate
    .setBody(buildJsonBodyFun)
    .build()

  return JSON.stringify(results)
}

function outputMarkdown () {
  let files = walkSync.entries(path)
  for (let i = 0; i < files.length; i++) {
    let file = files[i]
    let fileName = file.relativePath
    if (fileName === 'README.md') {
      break
    }
    let fileData = fs.readFileSync(path + fileName, 'utf8')
    let firstLine = fileData.split('\n')[0]
    let indexRegex = /#\s(\d+)\.\s/.exec(firstLine)
    if (!indexRegex || indexRegex.length < 1) {
      break
    }

    fs.appendFileSync('output.md', fileData + '\n\n')
  }
}

function outputHtml () {
  let lastH1Index = 0
  let md = new Remarkable()
    .use(remarkable => {
      remarkable.renderer.rules.heading_open = function (tokens, idx) {
        let content = tokens[idx + 1].content
        if (tokens[idx].hLevel === 1) {
          lastH1Index = content.split('. ')[0] - 1
          return '<h' + tokens[idx].hLevel + ' id=' + toc.slugify(content) + '>'
        } else {
          return '<h' + tokens[idx].hLevel + ' id=' + toc.slugify(content + ' ' + lastH1Index) + '>'
        }
      }
    })
  outputMarkdown()

  let fileData = fs.readFileSync('output.md', 'utf-8')
  fs.unlinkSync('output.md')
  let mdToc = toc(fileData).content
  let tocHtml = md.render(mdToc)
  let contentHtml = md.render(fileData)
  return htmlRender(tocHtml, contentHtml)
}

export function output (type: string): string {
  let output
  let workDir = Utils.getWorkDir()

  switch (type.toLowerCase()) {
    case 'csv':
      output = outputCsv()
      fs.writeFileSync(workDir + '/export.csv', output, 'utf-8')
      break
    case 'json':
      output = outputJson()
      fs.writeFileSync(workDir + '/export.json', output, 'utf-8')
      break
    case 'markdown':
      output = outputMarkdown()
      break
    case 'html':
      output = outputHtml()
      fs.writeFileSync(workDir + '/export.html', output, 'utf-8')
      break
    default:
      let message = '\n error: type ' + type + ' current not supported'
      console.log(message)
  }

  return output
}
