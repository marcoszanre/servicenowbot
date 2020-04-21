import { Dialog, DialogContext, DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext, ChoiceFactory, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActionTypes, ActivityTypes } from "botbuilder";

const axios = require('axios');
const qs = require('qs');
const TEXT_PROMPT = 'TEXT_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT'
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

export default class AbrirTicketDialog extends ComponentDialog {
    constructor(dialogId: string) {
        super(dialogId);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.confirmStep.bind(this),
            this.promptStep.bind(this),
            this.responseStep.bind(this)            
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
 
    }

    async confirmStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {    
        return await stepContext.prompt(CONFIRM_PROMPT, 'Você gostaria de abrir um ticket?');
    }

    async promptStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        if (stepContext.result) {
            return await stepContext.prompt(TEXT_PROMPT, 'Qual seria o erro por favor?');
        } else {
            await stepContext.context.sendActivity("Até a próxima e obrigado!");
             return await stepContext.endDialog();
        }
    }

    async responseStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        await stepContext.context.sendActivity( "Entendido! Vou abrir um ticket para o erro '" + stepContext.result + "'");

        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        
        const ticketsListPostRequest = await axios({
            method: 'post',
            url: 'https://dev88189.service-now.com/api/now/v2/table/incident',
            data: {
                short_description: stepContext.result
            },
            headers: {
                "Accept":"application/json",
                "Content-Type":"application/json",
                "Authorization": (
                    "Basic " + Buffer.from("admin:Office365").toString('base64')
                )
            }
        });

        await stepContext.context.sendActivity(`Ticket ${ticketsListPostRequest.data.result.number} criado com sucesso`);
        await stepContext.context.sendActivity("Até a próxima e obrigado! 😜");
        return await stepContext.endDialog();
    }
    
}
