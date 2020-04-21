import { Dialog, DialogContext, DialogTurnResult, ComponentDialog, WaterfallDialog, WaterfallStepContext, TextPrompt, DialogSet, DialogTurnStatus } from "botbuilder-dialogs";
import { CardFactory, AttachmentLayoutTypes, Attachment } from "botbuilder";
const axios = require('axios');

export default class HelpDialog extends ComponentDialog {
    constructor(dialogId: string) {
        super(dialogId);
    }

    public async beginDialog(context: DialogContext, options?: any): Promise<DialogTurnResult> {

        let msg: Attachment = 
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
        
        await context.context.sendActivity({ attachments: [msg] });
        
        // context.context.sendActivity(`I'm just a friendly but rather stupid bot, and right now I don't have any valuable help for you!`); 
        return await context.endDialog();

    }
}
