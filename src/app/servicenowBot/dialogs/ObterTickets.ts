import { Dialog, DialogContext, DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext, ChoiceFactory, ComponentDialog, ConfirmPrompt } from "botbuilder-dialogs";
import { ActionTypes, ActivityTypes, AttachmentLayoutTypes, HeroCard, CardFactory, MessageFactory, Attachment, AttachmentData } from "botbuilder";

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
        
        let cardAttachments: Attachment[] = [];

        // ticketsList.data.forEach(async ticketList => {
        //     const card = 
        //     CardFactory.thumbnailCard(
        //         'BotFramework Thumbnail Card',
        //         [{ url: 'https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg' }],
        //         [{
        //             title: 'Get started',
        //             type: 'openUrl',
        //             value: 'https://docs.microsoft.com/en-us/azure/bot-service/'
        //         }],
        //         {
        //             subtitle: 'Your bots — wherever your users are talking.',
        //             text: 'Build and connect intelligent bots to interact with your users naturally wherever they are, from text/sms to Skype, Slack, Office 365 mail and other popular services.'
        //         }
        //     );

        // //     CardFactory.thumbnailCard(
        // //         ticketList.number,
        // //         ['https://www.mpmit.co.uk/WP/wp-content/uploads/2018/08/Microsoft_Teams_logo.png'],
        // //         ['Abrir TIcket']
        // //    );
        //    cardAttachments.push(card);
        // });

        // console.log(cardAttachments);
            const message = MessageFactory.attachment(
                {
                    "contentType": "application/vnd.microsoft.teams.card.list",
                    "content": {
                      "title": "Lista de tickets",
                      "items": [
                        {
                          "type": "file",
                          "id": "https://contoso.sharepoint.com/teams/new/Shared%20Documents/Report.xlsx",
                          "title": "Report",
                          "subtitle": "teams > new > design",
                          "tap": {
                            "type": "imBack",
                            "value": "obter ticket"
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
            )
            await stepContext.context.sendActivity(message);
            //await stepContext.context.sendActivity(ticketList.number);

            await stepContext.context.sendActivity("Até a próxima e obrigado!");
            return await stepContext.endDialog();
        };
    
}
