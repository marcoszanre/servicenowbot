import { BotDeclaration } from "express-msteams-host";
import * as debug from "debug";
import { DialogSet, DialogState, DialogTurnStatus } from "botbuilder-dialogs";
import { StatePropertyAccessor, CardFactory, TurnContext, MemoryStorage, ConversationState, ActivityTypes, TeamsActivityHandler, MessageFactory, TeamsInfo } from "botbuilder";
import AbrirTicketDialog from "./dialogs/AbrirTicketDialog";
import ObterTicketsDialog from "./dialogs/ObterTickets";
import ObterTicketDialog from "./dialogs/ObterTicket";
const fs = require('fs');

// Initialize debug logging module
const log = debug("msteams");
const tenantID = process.env.TENANT_ID;
const checkTenant = process.env.CHECK_TENANT;

/**
 * Implementation for servicenow Bot
 */
@BotDeclaration(
    "/api/messages",
    new MemoryStorage(),
    process.env.MICROSOFT_APP_ID,
    process.env.MICROSOFT_APP_PASSWORD)

export class ServicenowBot extends TeamsActivityHandler {
    private readonly conversationState: ConversationState;
    private readonly dialogs: DialogSet;
    private dialogState: StatePropertyAccessor<DialogState>;

    /**
     * The constructor
     * @param conversationState
     */
    public constructor(conversationState: ConversationState) {
        super();
        
        this.conversationState = conversationState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.dialogs = new DialogSet(this.dialogState);
        this.dialogs.add(new AbrirTicketDialog("openTicketDialog"));
        this.dialogs.add(new ObterTicketsDialog("listTicketsDialog"));
        this.dialogs.add(new ObterTicketDialog("getTicketDialog"));
        
        // Confirm request comes from a valid tenant if checkTenant is true
        this.onTurn(async (context: TurnContext, next): Promise<void> => {
            
            if (checkTenant) {
            if (!this.checkTenant(context))
            {
                // Not authorized tenant
                await context.sendTraceActivity(`Not authorized`);
            } else {
                // Authorized tenant, continue
                await next();
            }
        }
        });


        this.onMessage(async (context: TurnContext): Promise<void> => {   

            const dc = await this.dialogs.createContext(context);

            // Cancel Dialog execution if user sends cancelar
            if (context.activity.text.startsWith("cancelar")) {
                await dc.cancelAllDialogs();
            }

            const results = await dc.continueDialog();

            // If there's no dialog running, run this
            if (results.status === DialogTurnStatus.empty) {

            switch (context.activity.type) {
                case ActivityTypes.Message:

                    let text = TurnContext.removeRecipientMention(context.activity);
                    text = text.toLowerCase();
                    
                    if (text.startsWith("abrir ticket")) {

                        await dc.beginDialog("openTicketDialog");

                    }  else if (text.startsWith("obter ticket")) {

                        await dc.beginDialog("getTicketDialog");

                    }  else if (text.startsWith("listar tickets")) {

                        await dc.beginDialog("listTicketsDialog");

                    }  else if (text.startsWith("cancelar")) {

                        await dc.context.sendActivity( "Entendido. Operação cancelada! 👍");
                        await dc.context.sendActivity( "Por favor, em que posso ajudar?");                        

                        let members = await TeamsInfo.getMembers(context);
                        members[0].userPrincipalName != undefined? await dc.context.sendActivity( members[0].userPrincipalName ): await dc.context.sendActivity( "Ops, erro 😒");

                    }  else {

                        const message = MessageFactory.attachment(
                            CardFactory.heroCard(
                                'Desculpe, não entendi, mas aqui estão algumas coisas que sei fazer 😀',
                                [],
                                ['abrir ticket','obter ticket','listar tickets']
                             )
                        );

                        await context.sendActivity(message);
                    }
                    break;
                default:
                    break;
            }
        }
            // Save state changes
            return this.conversationState.saveChanges(context);
        });


        this.onConversationUpdate(async (context: TurnContext): Promise<void> => {
            if (context.activity.membersAdded && context.activity.membersAdded.length !== 0) {
                for (const idx in context.activity.membersAdded) {
                    if (context.activity.membersAdded[idx].id === context.activity.recipient.id) {

                        const message = MessageFactory.carousel([
                            CardFactory.heroCard('Teams Bots',
                            CardFactory.images([`data:image/png;base64,${this.encodeBase64('src/app/web/assets/teamsLogo.png')}`, 'src/app/web/assets/teamsLogo.png']),
                            [{
                                type: 'openUrl',
                                title: 'Bot Framework',
                                value: 'https://docs.microsoft.com/en-us/microsoftteams/platform/bots/what-are-bots'
                            }]),
                            CardFactory.heroCard('Service Now', 
                            CardFactory.images([`data:image/png;base64,${this.encodeBase64('src/app/web/assets/servicenowLogo.png')}`, 'src/app/web/assets/servicenowLogo.png']),
                            [{
                                type: 'openUrl',
                                title: 'Service Now',
                                value: 'https://developer.servicenow.com/dev.do'
                            }]),
                            CardFactory.heroCard('Microsoft Teams',
                            CardFactory.images([`data:image/png;base64,${this.encodeBase64('src/app/web/assets/teamsLogo.png')}`, 'src/app/web/assets/teamsLogo.png']),
                            [{
                                type: 'openUrl',
                                title: 'Dev Platform',
                                value: 'https://docs.microsoft.com/en-us/microsoftteams/platform/'
                            }])
                        ])
                        
                        await context.sendActivity( message );
                    }
                }
            }
        });

        this.onReactionsAdded(async (context: TurnContext): Promise<void> => {
            const added = context.activity.reactionsAdded;

            if (added && added[0]) {
                await context.sendActivity({
                    textFormat: "xml",
                    text: `🙂👍 Eu gostei da reação (<b>${added[0].type}</b>)`
                });
            }
        });;
   }

   async checkTenant(context: TurnContext){
       return context.activity.conversation.tenantId == tenantID
   }

    encodeBase64(path) {
        const bitmap = fs.readFileSync(path);
        return new Buffer(bitmap).toString('base64')
    }


}
