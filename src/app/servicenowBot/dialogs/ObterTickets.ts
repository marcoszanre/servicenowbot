import { DialogTurnResult, WaterfallDialog, WaterfallStepContext, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActivityTypes, Attachment, TeamsInfo } from "botbuilder";

const fs = require('fs');
const axios = require('axios');
const CONFIRM_PROMPT = 'CONFIRM_PROMPT'
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const servicenowInstance = process.env.SERVICE_NOW_INSTANCE || "bypass string error check"
const servicenowCredentials = process.env.SERVICE_NOW_CREDENTIALS || "bypass string error check";
let userEmail: string;

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
        await stepContext.context.sendActivity("Envie 'cancelar' a qualquer momento para retornar ao início, ok? ✔");   
        await stepContext.context.sendActivities([{type:  ActivityTypes.Typing}]);    

        return await stepContext.prompt(CONFIRM_PROMPT, 'Você gostaria de ver seus tickets?');
    }

    async responseStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        if (stepContext.result) {


        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        await stepContext.context.sendActivity( "👍 Claro, seguem seus tickets abaixo:" );
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

        // Get tickets with the caller as the current user
        const ticketsListGetRequest = await axios.get(
            `https://${servicenowInstance}.service-now.com/api/now/v2/table/incident?sysparm_limit=5&caller_id=${servicenowSysID.data.result[0].sys_id}`,
            {
                headers: {
                    "Accept":"application/json",
                    "Content-Type":"application/json",
                    "Authorization": (
                        "Basic " + Buffer.from(servicenowCredentials).toString('base64')
                    )}
        });


        const ticketsList = ticketsListGetRequest.data.result;

        await stepContext.context.sendActivity( ticketsList[0].short_description );

        let items: Array<any> = [];
        ticketsList.forEach(async ticketList => {
            let obj = {
                type: 'resultItem',
                icon: 'https://media-exp1.licdn.com/dms/image/C4E0BAQEA_U8R9KDIiQ/company-logo_200_200/0?e=2159024400&v=beta&t=9QRf4vsp1RyddCUQRCAbeqOyERdBllACIbVX8xZoo1w',
                title: ticketList.number,
                subtitle: `${ticketList.short_description}`,
                tap: {
                    type: 'openUrl',
                    value: `https://${servicenowInstance}.service-now.com/nav_to.do?uri=incident.do?sys_id=${ticketList.sys_id}`
                }
            }
            items.push(obj);
        });

        let myItems = JSON.stringify(items).toString();

        let myCard: Attachment = JSON.parse(`{
            "contentType": "application/vnd.microsoft.teams.card.list",
            "content": {
              "title": "Seus tickets",
              "items": ${myItems},
              "buttons": [
                {
                    "type": "openUrl",
                    "title": "Abrir ServiceNow",
                    "value": "https://${servicenowInstance}.service-now.com/incident_list.do"
                }
              ]
            }
        }`);

        


        await stepContext.context.sendActivity({ attachments: [myCard] });

        await stepContext.context.sendActivity("Até a próxima e obrigado! 😀👍");
    }
        return await stepContext.endDialog();

    } else {

        await stepContext.context.sendActivity("Combinado, até a próxima e obrigado! 😀👍");
            return await stepContext.endDialog();
    }

    };

    encodeBase64(path) {
        const bitmap = fs.readFileSync(path);
        return new Buffer(bitmap).toString('base64')
    }
    
    
}
