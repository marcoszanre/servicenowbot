import { Dialog, DialogContext, DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext, ChoiceFactory, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActionTypes, ActivityTypes } from "botbuilder";

const axios = require('axios');
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
        await stepContext.context.sendActivity( "Sua resposta é " + stepContext.result );
        return await stepContext.prompt(TEXT_PROMPT, 'Qual seria o erro por favor?');
    }

    async responseStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);
        await stepContext.context.sendActivity( "Entendido! Vou abrir um ticket para o erro '" + stepContext.result + "'");
        const ticket = await axios.get("https://prod-01.brazilsouth.logic.azure.com:443/workflows/ee1d664e0737458e80fcc1aeb6e59bff/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=YDXlDk6ZGa1qhoRXD_Kc0cXZPDPA0nKvCOGQcgmvtkU&shortDescription="+stepContext.result);
        await stepContext.context.sendActivity(
            "Seu ticket foi aberto com os seguintes valores: "+
            "\n\n Número: "+ ticket.data.Number+
            "\n\n SysID: "+ ticket.data.SysID+
            "\n\n Urgency: "+ ticket.data.Urgency);
        await stepContext.context.sendActivity("Até a próxima e obrigado!");
        return await stepContext.endDialog();
    }
    
}
