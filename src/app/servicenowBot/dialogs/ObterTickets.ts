import { Dialog, DialogContext, DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext, ChoiceFactory, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActionTypes, ActivityTypes } from "botbuilder";

const axios = require('axios');
const CONFIRM_PROMPT = 'CONFIRM_PROMPT'
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

export default class ObterTicketsDialog extends ComponentDialog {
    constructor(dialogId: string) {
        super(dialogId);

        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.confirmStep.bind(this),
            this.responseStep.bind(this)            
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
 
    }

    async confirmStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {    
        await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    
        return await stepContext.prompt(CONFIRM_PROMPT, 'Você gostaria de ver seus tickets?');
    }

    async responseStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        await stepContext.context.sendActivity( "Claro, segue abaixo:" );
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        const ticketsList = await axios.get("https://prod-00.brazilsouth.logic.azure.com:443/workflows/f3a66689a3534206a8b4796ae9847216/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=GyIYcGDSNumIAlgmZRHQQ_g-B_PAqxtSUPUowtmx9lg");
        
        ticketsList.data.forEach(async ticketList => {
            await stepContext.context.sendActivity(ticketList.number);
        });

        await stepContext.context.sendActivity("Até a próxima e obrigado!");
        return await stepContext.endDialog();
    }
    
}
