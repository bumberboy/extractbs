import {z} from 'zod';
import {procedure, router} from '../trpc';
import {Configuration, OpenAIApi} from "openai";
import {TRPCError} from "@trpc/server";
import {BuildPrompt, CaseType, EPOutputFormat, ExtractionParams} from "../../promptbuilder/PromptBuilder";

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

      const systemPrompt = BuildPrompt(input.extractionParams)
      console.log(systemPrompt)
      try {
        const response = await openai.createChatCompletion({
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
        });
        console.log("openai responded")

        return {
          result: response.data.choices[0].message?.content,
        };
      } catch (error) {
        console.log('openai errored')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong. Hehe.',
          cause: error,
        })
      }


    })

});

// export type definition of API
export type AppRouter = typeof appRouter;