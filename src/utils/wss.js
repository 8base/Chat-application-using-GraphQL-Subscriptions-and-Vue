import WebSocket from "isomorphic-ws";
import { SubscriptionClient } from "subscriptions-transport-ws";

const { VUE_APP_8BASE_WS_ENDPOINT, VUE_APP_8BASE_WORKSPACE_ID } = process.env;

/**
 * Create the subscription client using the relevant environment
 * variables and default options
 */
const subscriptionClient = new SubscriptionClient(
  VUE_APP_8BASE_WS_ENDPOINT,
  {
    reconnect: true,
    connectionParams: {
      /**
       * WorkspaceID MUST be set or the Websocket Endpoint wont be able to
       * map the request to the appropriate workspace
       */
      workspaceId: VUE_APP_8BASE_WORKSPACE_ID,
    },
  },
  /**
   * Constructor for W3C compliant WebSocket implementation. Use this when
   * your environment does not have a built-in native WebSocket
   * (for example, with NodeJS client)
   */
  WebSocket
);

export default {
  /**
   * Accepts the subscription query, any variables and the
   * callback handlers 'data' and 'error'
   */
  subscribe: (query, options) => {
    const { variables, data, error } = options;
    /**
     * Runs the new subscription request.
     */
    const result = subscriptionClient.request({
      query,
      variables,
    });
    /**
     * The unsubscribe function can be used to close a specific
     * subscription as opposed to ALL subscriptions be maintained
     * by the subscriptionClient
     */
    const { unsubscribe } = result.subscribe({
      /**
       * Whenever an event is recieved, the result is passed
       * to the developer specified data callback.
       */
      next(result) {
        if (typeof data === "function") {
          data(result);
        }
      },
      /**
       * Whenever an error is recieved, the error is passed
       * to the developer specified error callback.
       */
      error(e) {
        if (typeof error === "function") {
          error(e);
        }
      },
    });

    return unsubscribe;
  },
  /**
   * Closes subscriptionClient's connection.
   */
  close: () => {
    subscriptionClient.close();
  },
};