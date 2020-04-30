import { DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActivityTypes, CardFactory, TeamsInfo } from "botbuilder";

const fs = require('fs');
const axios = require('axios');
const TEXT_PROMPT = 'TEXT_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT'
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const servicenowInstance = process.env.SERVICE_NOW_INSTANCE || "bypass string error check"
const servicenowCredentials = process.env.SERVICE_NOW_CREDENTIALS || "bypass string error check";
let userEmail: string;

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
        await stepContext.context.sendActivity("Envie 'cancelar' a qualquer momento para retornar ao início, ok? ✔");  
        return await stepContext.prompt(CONFIRM_PROMPT, 'Você gostaria de abrir um ticket?');
    }

    async promptStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        if (stepContext.result) {
            return await stepContext.prompt(TEXT_PROMPT, 'Qual seria o erro por favor?');
        } else {
            await stepContext.context.sendActivity("Até a próxima e obrigado! 👍");
             return await stepContext.endDialog();
        }
    }

    async responseStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        await stepContext.context.sendActivity( "Entendido! Vou abrir um ticket para o erro '" + stepContext.result + "', ok? 😉");
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});

        // Get Teams user user principal name
        let members = await TeamsInfo.getMembers(stepContext.context);
        if (members[0].userPrincipalName) {

        // Get Service Now SysID for User based on user UPN
        const servicenowSysID = await axios.get(
            `https://${servicenowInstance}.service-now.com/api/now/v2/table/sys_user?sysparm_limit=1&email=${members[0].userPrincipalName}`,
            {
                headers: {
                    "Accept":"application/json",
                    "Content-Type":"application/json",
                    "Authorization": (
                        "Basic " + Buffer.from(servicenowCredentials).toString('base64')
                    )}
        });
        
        // Create a new ticket ID with the user as caller in Service Now
        const ticketsListPostRequest = await axios({
            method: 'post',
            url: `https://${servicenowInstance}.service-now.com/api/now/v2/table/incident`,
            data: {
                short_description: stepContext.result,
                caller_id: servicenowSysID.data.result[0].sys_id
            },
            headers: {
                "Accept":"application/json",
                "Content-Type":"application/json",
                "Authorization": (
                    "Basic " + Buffer.from(servicenowCredentials).toString('base64')
                )
            }
        });

        // Build Card for response
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
                                        "url": "https://media-exp1.licdn.com/dms/image/C4E0BAQEA_U8R9KDIiQ/company-logo_200_200/0?e=2159024400&v=beta&t=9QRf4vsp1RyddCUQRCAbeqOyERdBllACIbVX8xZoo1w",
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
                        "url": `https://${servicenowInstance}.service-now.com/nav_to.do?uri=incident.do?sys_id=${ticketsListPostRequest.data.result.sys_id}`
                    }
                ],
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "version": "1.0"
            }
        );

        await stepContext.context.sendActivity({ attachments: [ticketCard] } );

        await stepContext.context.sendActivity("Até a próxima e obrigado! 😀");
        }
        return await stepContext.endDialog();
    }

    encodeBase64(path) {
        const bitmap = fs.readFileSync(path);
        return new Buffer(bitmap).toString('base64')
    }
    
}
