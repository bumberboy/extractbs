import {z} from 'zod';
import {procedure, router} from '../trpc';
import {Configuration, OpenAIApi} from "openai";
import {TRPCError} from "@trpc/server";
import {BuildPrompt, CaseType, EPOutputFormat, ExtractionParams} from "../../promptbuilder/PromptBuilder";
import {PrismaClient} from '@prisma/client'
import {v4 as uuidv4} from 'uuid';

const prisma = new PrismaClient()

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_KEY,
}))

export const appRouter = router({
    hello: procedure
      .input(
        z.object({
          text: z.string(),
        }),
      )
      .query(({input}) => {
        return {
          greeting: `hello ${input.text}`,
        };
      }),
    getExtractionResult: procedure.input(
      z.object({
        extractionID: z.string()
      }),
    ).query(async ({input}) => {

      const result = await prisma.extractionRequest.findUnique({
        where: {
          uuid: input.extractionID
        }
      })

      if (result) {

        if (result.completedAt) {
          return result.result
        }
        return null
      } else {
        return null
      }
    }),
    extract: procedure.input(
      z.object({
        text: z.string(),
        extractionParams: z.object({
          outputFormat: z.nativeEnum(EPOutputFormat),
          dateParams: z.object({
            dateFormat: z.string(),
            addYear: z.boolean(),
          }),
          descParams: z.object({
            cleanUp: z.boolean(),
            caseType: z.nativeEnum(CaseType),
            extractPhone: z.boolean(),
            removePhone: z.boolean(),
          }),
          amountParams: z.object({
            splitCreditDebit: z.boolean(),
          }),
          categoryParams: z.object({
            categories: z.array(z.string()),
            blankCategoryWord: z.string(),
          }).optional(),
        })
      })
    )
      .mutation(async ({input}) => {
        const newUUID = uuidv4()
        const newExtractionRequest = await prisma.extractionRequest.create({
          data: {
            uuid: newUUID
          }
        })

        const systemPrompt = BuildPrompt(input.extractionParams)
        console.log(systemPrompt)
        openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              "role": "system",
              "content": systemPrompt,
            },
            {"role": "user", "content": input.text},
          ],
          temperature: 0,
          max_tokens: 2000,
        }).then(async (response) => {
          console.log("openai responded")
          await prisma.extractionRequest.update({
            where: {
              uuid: newExtractionRequest.uuid
            },
            data: {
              result: response.data.choices[0].message?.content,
              completedAt: new Date()
            }
          })
        }).catch((error) => {
          console.log('openai errored', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong.',
            cause: error,
          })
        })
        return newUUID
      })
  })
;

// export type definition of API
export type AppRouter = typeof appRouter;