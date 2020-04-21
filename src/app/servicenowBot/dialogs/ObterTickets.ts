import { Dialog, DialogContext, DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext, ChoiceFactory, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActionTypes, ActivityTypes, AttachmentLayoutTypes, HeroCard, CardFactory, MessageFactory, Attachment, AttachmentData } from "botbuilder";

const axios = require('axios');
const Adaptive = require('adaptivecards');
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
        if (stepContext.result) {


        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        await stepContext.context.sendActivity( "Claro, seguem seus tickets abaixo:" );
        await stepContext.context.sendActivity({type:  ActivityTypes.Typing});
        //const ticketsList = await axios.get("https://prod-00.brazilsouth.logic.azure.com:443/workflows/f3a66689a3534206a8b4796ae9847216/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=GyIYcGDSNumIAlgmZRHQQ_g-B_PAqxtSUPUowtmx9lg");

        const ticketsListGetRequest = await axios.get(
            'https://dev88189.service-now.com/api/now/v2/table/incident?sysparm_limit=5',
            {
                headers: {
                    "Accept":"application/json",
                    "Content-Type":"application/json",
                    "Authorization": (
                        "Basic " + Buffer.from("admin:Office365").toString('base64')
                    )}
        });


        const ticketsList = ticketsListGetRequest.data.result;
        // console.log(ticketsList);

        var items: Array<any> = [];
        ticketsList.forEach(async ticketList => {
            let obj = {
                type: 'resultItem',
                icon: 'https://store-images.s-microsoft.com/image/apps.38465.c7644961-96fb-4a94-b271-37687f682ccb.eec30b06-7df1-4c5c-948c-37df2598f39f.3a46fe3c-57fc-4ece-adb7-73587bd0bc1b.png',
                title: ticketList.number,
                subtitle: ticketList.number,
                tap: {
                    type: 'openUrl',
                    value: 'https://dev88189.service-now.com/nav_to.do?uri=%2F$restapi.do'
                }
            }
            items.push(obj);
        });

        let myItems = JSON.stringify(items).toString();
        // console.log(JSON.stringify(items).toString());

        let myCard = `{
            "contentType": "application/vnd.microsoft.teams.card.list",
            "content": {
              "title": "Seus tickets",
              "items": ${myItems},
              "buttons": [
                {
                    "type": "imBack",
                    "title": "Select",
                    "value": "whois"
                }
              ]
            }
        }`;

        const customCard: Attachment = {
            contentType: "application/vnd.microsoft.teams.card.list",
            content: `"title": "Seus tickets",
            "items": ${myItems},
            "buttons": [
              {
                  "type": "imBack",
                  "title": "Select",
                  "value": "whois"
              }
            ]`
        }

        const customCard2: Attachment = {
            contentType: "application/vnd.microsoft.teams.card.list",
            content: `{"title": "Seus tickets",
            "items": ${myItems},
            "buttons": [
              {
                  "type": "imBack",
                  "title": "Select",
                  "value": "whois"
              }
            ]}`
        }

        // console.log(myCard);

        // let cardAttachment: Attachment = JSON.parse(myCard);

        // console.log(myCard);

        // let cardAttachment: Attachment = JSON.parse(myCard);
        
        let msg = CardFactory.adaptiveCard(
            {
                "contentType": "application/vnd.microsoft.teams.card.list",
                "content": {
                  "title": "Card title",
                  "items": [
                    {
                      "type": "file",
                      "id": "https://contoso.sharepoint.com/teams/new/Shared%20Documents/Report.xlsx",
                      "title": "Report",
                      "subtitle": "teams > new > design",
                      "tap": {
                        "type": "imBack",
                        "value": "editOnline https://contoso.sharepoint.com/teams/new/Shared%20Documents/Report.xlsx"
                      }
                    },
                    {
                      "type": "resultItem",
                      "icon": "https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Trello-128.png",
                      "title": "Trello title",
                      "subtitle": "A Trello subtitle",
                      "tap": {
                        "type": "openUrl",
                        "value": "http://trello.com"
                      }
                    },
                    {
                      "type": "section",
                      "title": "Manager"
                    },
                    {
                      "type": "person",
                      "id": "JohnDoe@contoso.com",
                      "title": "John Doe",
                      "subtitle": "Manager",
                      "tap": {
                        "type": "imBack",
                        "value": "whois JohnDoe@contoso.com"
                      }
                    }
                  ],
                  "buttons": [
                    {
                      "type": "imBack",
                      "title": "Select",
                      "value": "whois"
                    }
                  ]
                }
              }
        );
        await stepContext.context.sendActivity({ attachments: [msg] });

        await stepContext.context.sendActivity("Até a próxima e obrigado! 😎");
        return await stepContext.endDialog();

    } else {
        await stepContext.context.sendActivity("Combinado, até a próxima e obrigado!");
            return await stepContext.endDialog();
    }
        };
    
    
}
