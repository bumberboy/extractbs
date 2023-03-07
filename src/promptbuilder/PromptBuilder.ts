export interface ExtractionParams {
  outputFormat: EPOutputFormat
  dateParams: EPDateParams
  descParams: EPDescParams
  amountParams: EPAmountParams
  categoryParams?: EPCategoryParams
}

export enum EPOutputFormat {
  CSV = 'csv',
  HTMLTable = 'htmltable',
}

export interface EPDateParams {
  dateFormat: string
  addYear: boolean
}

export interface EPDescParams {
  cleanUp: boolean
  caseType: CaseType
  extractPhone: boolean // puts it into a new col
  removePhone: boolean // remove them completely
}

export enum CaseType {
  Upper = 'upper',
  Lower = 'lower',
  Title = 'title',
  Sentence = 'sentence',
}

export interface EPAmountParams {
  splitCreditDebit: boolean
}

export interface EPCategoryParams {
  categories: string[]
  blankCategoryWord: string

}

export interface ChildPromptBuilderResp {
  prompt: string
  cols: string[]
}

export const BuildDatePrompt = (dateParams: EPDateParams) => {
  let out = ""
  if (dateParams.addYear) {
    out += `Today is ${Date()}. Add year to the expense dates. All dates are in the past.`
  }

  if (dateParams.dateFormat) {
    out += `The date format is ${dateParams.dateFormat}.`
  }

  return {
    prompt: out,
    cols: ['date'],
  }
}

export const BuildDescPrompt = (descParams: EPDescParams): ChildPromptBuilderResp => {
  let out = ""
  let outCols = ['description']
  if (descParams.cleanUp) {
    out += `Clean up the description.`
  }

  if (descParams.caseType) {
    out += `Convert the description to ${descParams.caseType} case.`
  }

  if (descParams.extractPhone) {
    out += `Extract the phone numbers from the description into the telephone column.`
    outCols.push('telephone')
  }

  if (descParams.removePhone) {
    out += `Remove the telephone number from the description.`
  }

  return {
    prompt: out,
    cols: outCols,
  }
}

export const BuildAmountPrompt = (amountParams: EPAmountParams): ChildPromptBuilderResp => {
  let out = ""
  let outCols = []
  if (amountParams.splitCreditDebit) {
    out += `Split the amount into credit and debit columns.`
    outCols = ['amount_cr', 'amount_dr']
  } else {
    outCols = ['amount']
  }

  return {
    prompt: out,
    cols: outCols,
  }
}

export const BuildCategoryPrompt = (categoryParams?: EPCategoryParams): ChildPromptBuilderResp => {
  let out = ""
  let outCols = [] as string[]
  if (!categoryParams) {
    return {
      prompt: out,
      cols: outCols,
    }
  }
  outCols.push("category")
  out += `Use your best-guess effort to classify records into the following categories: (${categoryParams.categories}).`


  if (categoryParams.blankCategoryWord) {
    out += `If unsure of the category, mark it as ${categoryParams.blankCategoryWord}.`
  }

  return {
    prompt: out,
    cols: outCols,
  }
}

export const BuildPrompt = (params: ExtractionParams): string => {
  const dateParams = params.dateParams
  const descParams = params.descParams
  const amountParams = params.amountParams
  const categoryParams = params.categoryParams

  const datePromptResp = BuildDatePrompt(dateParams)
  const descPromptResp = BuildDescPrompt(descParams)
  const amountPromptResp = BuildAmountPrompt(amountParams)
  const categoryPromptResp = BuildCategoryPrompt(categoryParams)

  const basePrompt = BuildBasePrompt(
    [
      ...datePromptResp.cols,
      ...descPromptResp.cols,
      ...amountPromptResp.cols,
      ...categoryPromptResp.cols,
    ], params.outputFormat)

  return `This is a bank statement. 
  ${basePrompt} 
  ${datePromptResp.prompt} 
  ${descPromptResp.prompt} 
  ${amountPromptResp.prompt} 
  ${categoryPromptResp.prompt}`
}

const BuildBasePrompt = (cols: string[], format: EPOutputFormat): string => {
  const colStr = cols.join(', ')

  let f = format.toString()
  switch (format) {
    case EPOutputFormat.CSV:
      f = 'CSV'
      break
    case EPOutputFormat.HTMLTable:
      f = 'HTML table'
  }

  return `Clean up the input and extract the data into a ${f} with ${cols.length} columns: ${colStr}. 
  Remove "previous balance" or "total amount" rows if any.`
}