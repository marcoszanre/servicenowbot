import { Dialog, DialogContext, DialogTurnResult, ComponentDialog, WaterfallDialog, WaterfallStepContext, TextPrompt, DialogSet } from "botbuilder-dialogs";

export default class HelpDialog extends ComponentDialog {
    constructor(dialogId: string) {
        super(dialogId);
    }

    public async beginDialog(context: DialogContext, options?: any): Promise<DialogTurnResult> {

        context.context.sendActivity(`I'm just a friendly but rather stupid bot, and right now I don't have any valuable help for you!`);
        
        this.dialogs.add(new WaterfallDialog("contoso", [
            async (step: WaterfallStepContext) => {
                return await step.prompt("choicePrompt", "Qual sua dúvida?")
            },
            async (step: WaterfallStepContext) => {
                context.context.sendActivity(step.result);
                return await step.endDialog();
            } 
        ]))

        this.dialogs.add(new TextPrompt("choicePrompt"));
        
        // context.context.sendActivity(`I'm just a friendly but rather stupid bot, and right now I don't have any valuable help for you!`);
        return await context.endDialog();
    }
}
