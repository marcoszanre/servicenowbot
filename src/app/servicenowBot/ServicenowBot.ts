import { BotDeclaration, MessageExtensionDeclaration, PreventIframe } from "express-msteams-host";
import * as debug from "debug";
import { DialogSet, DialogState, TextPrompt } from "botbuilder-dialogs";
import { StatePropertyAccessor, CardFactory, TurnContext, MemoryStorage, ConversationState, ActivityTypes, TeamsActivityHandler } from "botbuilder";
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
        

        this.onTurn(async (context: TurnContext): Promise<void> => {   

            const dc = await this.dialogs.createContext(context);
            await dc.continueDialog();

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
                         // await context.sendActivity(`I\'m terribly sorry, but my master hasn\'t trained me to do anything yet...`);
                    }
                    break;
                default:
                    break;
            }
            // Save state changes
            return this.conversationState.saveChanges(context);
        });

        this.onConversationUpdate(async (context: TurnContext): Promise<void> => {
            if (context.activity.membersAdded && context.activity.membersAdded.length !== 0) {
                for (const idx in context.activity.membersAdded) {
                    if (context.activity.membersAdded[idx].id === context.activity.recipient.id) {
                        const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
                        await context.sendActivity({ attachments: [welcomeCard] });
                    }
                }
            }
        });

        this.onMessageReaction(async (context: TurnContext): Promise<void> => {
            const added = context.activity.reactionsAdded;
            if (added && added[0]) {
                await context.sendActivity({
                    textFormat: "xml",
                    text: `That was an interesting reaction (<b>${added[0].type}</b>)`
                });
            }
        });;
   }


}
