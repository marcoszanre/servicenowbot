import { BotDeclaration, MessageExtensionDeclaration, PreventIframe } from "express-msteams-host";
import * as debug from "debug";
import { DialogSet, DialogState, TextPrompt, DialogTurnStatus } from "botbuilder-dialogs";
import { StatePropertyAccessor, CardFactory, TurnContext, MemoryStorage, ConversationState, ActivityTypes, TeamsActivityHandler, MessageFactory, ContactRelationUpdateActionTypes } from "botbuilder";
import HelpDialog from "./dialogs/HelpDialog";
import AbrirTicketDialog from "./dialogs/AbrirTicketDialog";
import ObterTicketsDialog from "./dialogs/ObterTickets";
import ObterTicketDialog from "./dialogs/ObterTicket";
import WelcomeCard from "./dialogs/WelcomeDialog";

// Initialize debug logging module
const log = debug("msteams");

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
        this.dialogs.add(new HelpDialog("help"));
        this.dialogs.add(new AbrirTicketDialog("abrir_ticket"));
        this.dialogs.add(new ObterTicketsDialog("obter_tickets"));
        this.dialogs.add(new ObterTicketDialog("obter_ticket"));
        

        this.onMessage(async (context: TurnContext): Promise<void> => {   

            const dc = await this.dialogs.createContext(context);
            const results = await dc.continueDialog();

            if (results.status === DialogTurnStatus.empty) {

            // TODO: add your own bot logic in here
            switch (context.activity.type) {
                case ActivityTypes.Message:
                    let text = TurnContext.removeRecipientMention(context.activity);
                    text = text.toLowerCase();
                    if (text.startsWith("hello")) {
                        await context.sendActivity("Oh, hello to you as well!");
                        return;
                    } else if (text.startsWith("help")) {  
                        await dc.beginDialog("help");
                    } else if (text.startsWith("abrir ticket")) {
                        await dc.beginDialog("abrir_ticket");
                    }  else if (text.startsWith("obter tickets")) {
                        await dc.beginDialog("obter_tickets");
                    }  else if (text.startsWith("obter ticket")) {
                        await dc.beginDialog("obter_ticket");
                    }  else {
                        const message = MessageFactory.suggestedActions(['abrir ticket', 'obter tickets', 'obter ticket'], `Desculpe, não entendi, mas posso te ajudar com as seguintes ações:`);
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

                        let imgLink = "https://www.mpmit.co.uk/WP/wp-content/uploads/2018/08/Microsoft_Teams_logo.png";

                        const message = MessageFactory.carousel([
                            CardFactory.heroCard('Abrir ticket', [imgLink], [{
                                type: 'openUrl',
                                title: 'Get started',
                                value: 'https://docs.microsoft.com/en-us/azure/bot-service/'
                            }]),
                            CardFactory.heroCard('Obter Ticket', [imgLink], [{
                                type: 'openUrl',
                                title: 'Get started',
                                value: 'https://docs.microsoft.com/en-us/azure/bot-service/'
                            }]),
                            CardFactory.heroCard('Obter Ticket', [imgLink], [{
                                type: 'openUrl',
                                title: 'Get started',
                                value: 'https://docs.microsoft.com/en-us/azure/bot-service/'
                            }])
                        ])
                        // const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
                        // await context.sendActivity({ attachments: [welcomeCard] });
                        await context.sendActivity( message );
                    }
                }
            }
        });

        this.onReactionsAdded(async (context: TurnContext): Promise<void> => {
            const added = context.activity.reactionsAdded;

            // const message = MessageFactory.list([
            //     CardFactory.heroCard('title1', ['imageUrl1'], ['button1']),
            //     CardFactory.heroCard('title2', ['imageUrl2'], ['button2'])
            // ]);

            // await context.sendActivity(message); 

            if (added && added[0]) {
                await context.sendActivity({
                    textFormat: "xml",
                    text: `That was an interesting reaction (<b>${added[0].type}</b>)`
                });
            }
        });;
   }


}
