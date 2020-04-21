import { Dialog, DialogContext, DialogTurnResult, ComponentDialog, WaterfallDialog, WaterfallStepContext, TextPrompt, DialogSet, DialogTurnStatus } from "botbuilder-dialogs";
import { CardFactory, AttachmentLayoutTypes } from "botbuilder";
const axios = require('axios');

export default class HelpDialog extends ComponentDialog {
    constructor(dialogId: string) {
        super(dialogId);
    }

    public async beginDialog(context: DialogContext, options?: any): Promise<DialogTurnResult> {
        
        context.context.sendActivity(`I'm just a friendly but rather stupid bot, and right now I don't have any valuable help for you!`); 
        return await context.endDialog();

    }
}
