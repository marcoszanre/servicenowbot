import { Dialog, DialogContext, DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext, ChoiceFactory, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActionTypes, ActivityTypes, CardFactory } from "botbuilder";

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
        await stepContext.context.sendActivity("Envie cancelar a qualquer momento para retornar ao início, ok? ✔");  
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
                                        "text": ticketsListPostRequest.data.result.number,
                                        "wrap": true
                                    },
                                    {
                                        "type": "TextBlock",
                                        "spacing": "None",
                                        "text": `Created ${ ticketsListPostRequest.data.result.opened_at }`,
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
                        "text": ticketsListPostRequest.data.result.short_description
                    },
                    {
                        "type": "FactSet",
                        "facts": [
                            {
                                "title": "Number",
                                "value": ticketsListPostRequest.data.result.number
                            },
                            {
                                "title": "Importance",
                                "value": ticketsListPostRequest.data.result.urgency
                            },
                            {
                                "title": "SysID",
                                "value": ticketsListPostRequest.data.result.sys_id
                            }
                        ]
                    }
                ],
                "actions": [
                    {
                        "type": "Action.OpenUrl",
                        "title": "Abrir",
                        "url": `https://dev88189.service-now.com/nav_to.do?uri=incident.do?sys_id=${ticketsListPostRequest.data.result.sys_id}`
                    }
                ],
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "version": "1.0"
            }
        );

        await stepContext.context.sendActivity({ attachments: [ticketCard] } );

        // await stepContext.context.sendActivity(`Ticket ${ticketsListPostRequest.data.result.number} criado com sucesso`);
        await stepContext.context.sendActivity("Até a próxima e obrigado! 😜");
        return await stepContext.endDialog();
    }
    
}
