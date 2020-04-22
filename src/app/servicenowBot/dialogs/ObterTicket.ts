import { Dialog, DialogContext, DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext, ChoiceFactory, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActionTypes, ActivityTypes, CardFactory } from "botbuilder";

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
            this.responseStep.bind(this)//,
            // this.newTicketDescriptin.bind(this),
            // this.updateTicket.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
 
    }

    async confirmStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {    
        await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    
        return await stepContext.prompt(CONFIRM_PROMPT, 'Você gostaria de ver seu ticket?');
    }

    async ticketPromptStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {    
        await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    
        return await stepContext.prompt(TEXT_PROMPT, 'Qual o número do seu ticket? (ex: INC0000009)');
    }

    async responseStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        await stepContext.context.sendActivity( "Segue abaixo seu ticket:" );
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        // const ticket = await axios.get("https://prod-23.brazilsouth.logic.azure.com:443/workflows/b18e56cd7530482ba7fc0142f0bb69c1/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XGPeSxqNZdeVU7_ofsQcge3CPjaRMC4w3ACdgV9cll8");

        const ticket = await axios.get(
            `https://dev88189.service-now.com/api/now/v2/table/incident?sysparm_limit=1&number=${stepContext.result}`,
            {
                headers: {
                    "Accept":"application/json",
                    "Content-Type":"application/json",
                    "Authorization": (
                        "Basic " + Buffer.from("admin:Office365").toString('base64')
                    )}
        });


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
                                        "url": "https://store-images.s-microsoft.com/image/apps.38465.c7644961-96fb-4a94-b271-37687f682ccb.eec30b06-7df1-4c5c-948c-37df2598f39f.3a46fe3c-57fc-4ece-adb7-73587bd0bc1b.png",
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
                        "url": `https://dev88189.service-now.com/nav_to.do?uri=incident.do?sys_id=${ticket.data.result[0].sys_id}`
                    }
                ],
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "version": "1.0"
            }
        );



        await stepContext.context.sendActivity({ attachments: [ticketCard] } );
        
        // await stepContext.context.sendActivity(ticket.data.Summary);

        await stepContext.context.sendActivity("Até a próxima e obrigado! 🙂");
        return await stepContext.endDialog();


        // return await stepContext.prompt(CONFIRM_PROMPT, 'Você gostaria de atualizar este ticket?');

    }

    // async newTicketDescriptin(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
    //     if (stepContext.result == true) {
    //         await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    
    //         return await stepContext.prompt(TEXT_PROMPT, 'Qual a nova descrição do seu ticket?');
    //     } else {
    //         await stepContext.context.sendActivity("Até a próxima e obrigado!");
    //         return await stepContext.endDialog();
    //     }
    // }

    // async updateTicket(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
    //         await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    
    //         const ticket = await axios.get("https://prod-06.brazilsouth.logic.azure.com:443/workflows/47777cbcdb894759a399b966b7920701/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cgM5cmfGjgT4WXuP5rCuEUp3AoZNFri3tu7y6bBt8pM&shortDescription="+stepContext.result);
    //         await stepContext.context.sendActivity(ticket.data.Summary);
    //         await stepContext.context.sendActivity("Até a próxima e obrigado!");
    //         return await stepContext.endDialog();
    // }
    
}
