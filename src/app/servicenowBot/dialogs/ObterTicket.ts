import { DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActivityTypes, CardFactory } from "botbuilder";

const fs = require('fs');
const axios = require('axios');
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const servicenowInstance = process.env.SERVICE_NOW_INSTANCE || "bypass string error check"
const servicenowCredentials = process.env.SERVICE_NOW_CREDENTIALS || "bypass string error check";

export default class ObterTicketDialog extends ComponentDialog {
    constructor(dialogId: string) {
        super(dialogId);

        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.confirmStep.bind(this),
            this.ticketPromptStep.bind(this),
            this.responseStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
 
    }

    async confirmStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> { 
        await stepContext.context.sendActivity("Envie cancelar a qualquer momento para retornar ao início, ok? ✔");   
        await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    
        return await stepContext.prompt(CONFIRM_PROMPT, 'Você gostaria de ver seu ticket?');
    }

    async ticketPromptStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {    
        if (stepContext.result) {
            return await stepContext.prompt(TEXT_PROMPT, 'Qual o número do seu ticket por favor? (ex: INC0000009)');
        } else {
            await stepContext.context.sendActivity("Até a próxima e obrigado! 👍");
             return await stepContext.endDialog();
        }
    }

    async responseStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        await stepContext.context.sendActivity( "Segue abaixo seu ticket:" );
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});

        // Return current tickets which have the user as caller
        const ticket = await axios.get(
            `https://${servicenowInstance}.service-now.com/api/now/v2/table/incident?sysparm_limit=1&number=${stepContext.result}`,
            {
                headers: {
                    "Accept":"application/json",
                    "Content-Type":"application/json",
                    "Authorization": (
                        "Basic " + Buffer.from(servicenowCredentials).toString('base64')
                    )}
        });


        // Build the response card
        let ticketCard = CardFactory.adaptiveCard(
            {
                "type": "AdaptiveCard",
                "body": [
                    {
                        "type": "TextBlock",
                        "size": "Medium",
                        "weight": "Bolder",
                        "text": "Ticket Description"
                    },
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "items": [
                                    {
                                        "type": "Image",
                                        "altText": "",
                                        "url": `data:image/png;base64,${this.encodeBase64('src/app/web/assets/servicenowLogo.png')}`,
                                        "horizontalAlignment": "Left",
                                        "size": "Medium"
                                    }
                                ],
                                "width": "auto"
                            },
                            {
                                "type": "Column",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "weight": "Bolder",
                                        "text": ticket.data.result[0].number,
                                        "wrap": true
                                    },
                                    {
                                        "type": "TextBlock",
                                        "spacing": "None",
                                        "text": `Created ${ ticket.data.result[0].opened_at }`,
                                        "isSubtle": true,
                                        "wrap": true
                                    }
                                ],
                                "width": "stretch"
                            }
                        ]
                    },
                    {
                        "type": "TextBlock",
                        "text": ticket.data.result[0].short_description
                    }, 
                    {
                        "type": "FactSet",
                        "facts": [
                            {
                                "title": "Number",
                                "value": ticket.data.result[0].number
                            },
                            {
                                "title": "Importance",
                                "value": ticket.data.result[0].urgency
                            },
                            {
                                "title": "SysID",
                                "value": ticket.data.result[0].sys_id
                            }
                        ]
                    }
                ],
                "actions": [
                    {
                        "type": "Action.OpenUrl",
                        "title": "Abrir",
                        "url": `https://${servicenowInstance}.service-now.com/nav_to.do?uri=incident.do?sys_id=${ticket.data.result[0].sys_id}`
                    }
                ],
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "version": "1.0"
            }
        );

        await stepContext.context.sendActivity({ attachments: [ticketCard] } );
        
        await stepContext.context.sendActivity("Até a próxima e obrigado! 🙂");
        return await stepContext.endDialog();
        
    }

    encodeBase64(path) {
        const bitmap = fs.readFileSync(path);
        return new Buffer(bitmap).toString('base64')
    }
    
}
