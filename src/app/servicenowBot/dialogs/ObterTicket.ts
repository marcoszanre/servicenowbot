import { Dialog, DialogContext, DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext, ChoiceFactory, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActionTypes, ActivityTypes } from "botbuilder";

const axios = require('axios');
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

export default class ObterTicketDialog extends ComponentDialog {
    constructor(dialogId: string) {
        super(dialogId);

        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.confirmStep.bind(this),
            this.ticketPromptStep.bind(this),
            this.responseStep.bind(this),
            this.newTicketDescriptin.bind(this),
            this.updateTicket.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
 
    }

    async confirmStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {    
        await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    
        return await stepContext.prompt(CONFIRM_PROMPT, 'Você gostaria de ver seus tickets?');
    }

    async ticketPromptStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {    
        await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    
        return await stepContext.prompt(TEXT_PROMPT, 'Qual o número do seu ticket?');
    }

    async responseStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        await stepContext.context.sendActivity( "Segue abaixo seu ticket:" );
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        const ticket = await axios.get("https://prod-23.brazilsouth.logic.azure.com:443/workflows/b18e56cd7530482ba7fc0142f0bb69c1/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XGPeSxqNZdeVU7_ofsQcge3CPjaRMC4w3ACdgV9cll8");
        
        // console.log(ticket);

        await stepContext.context.sendActivity(ticket.data.Summary);

        return await stepContext.prompt(CONFIRM_PROMPT, 'Você gostaria de atualizar este ticket?');

    }

    async newTicketDescriptin(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        if (stepContext.result == true) {
            await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    
            return await stepContext.prompt(TEXT_PROMPT, 'Qual a nova descrição do seu ticket?');
        } else {
            await stepContext.context.sendActivity("Até a próxima e obrigado!");
            return await stepContext.endDialog();
        }
    }

    async updateTicket(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
            await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    
            const ticket = await axios.get("https://prod-06.brazilsouth.logic.azure.com:443/workflows/47777cbcdb894759a399b966b7920701/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cgM5cmfGjgT4WXuP5rCuEUp3AoZNFri3tu7y6bBt8pM&shortDescription="+stepContext.result);
            await stepContext.context.sendActivity(ticket.data.Summary);
            await stepContext.context.sendActivity("Até a próxima e obrigado!");
            return await stepContext.endDialog();
    }
    
}
