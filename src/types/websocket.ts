export type WebSocketMessageType = "CONNECT" | "DISCONNECT" | "MESSAGE" | "NOTIFICATION" | "TYPING" | "STOP_TYPING";

export type WebSocketMessageDataSender = {
  id: string;
  name: string;
  image: string;
}
export type WebSocketMessageData = {
  id: string;
  chatId: string;
  sender: WebSocketMessageDataSender;
  content: string;
  createdAt?: Date;
  sent?: boolean;
}

export type WebSocketMessage = {
  type: WebSocketMessageType;
  data: WebSocketMessageData;
}
