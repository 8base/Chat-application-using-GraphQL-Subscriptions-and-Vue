<template>
  <div id="app">
    <!-- 
      Only if the current user has an ID (has been created) should the
      chat view be rendered. Otherwise, a sign up for is shown.
     -->
    <div v-if="me.id" class="chat">
      <div class="header">
        <!-- 
          Since we're using subscriptions that run in real-time, our
          numbe of user currently online will dynamically adjust.
         -->
        {{ participants.length }} Online Users
        <!-- 
          A user can leave the chat by executing the 
          closeChat function.
         -->
        <button @click="closeChat">Leave Chat</button>
      </div>
      <!-- 
        For every message that we're storing in the messages array,
        we'll render out in a div. Additionally, if the messages participant
        id matches the current user id, we'll assign it the me class.
       -->
      <div
        :key="index"
        v-for="(msg, index) in messages"
        :class="['msg', { me: msg.participant.id === me.id }]"
      >
        <p>{{ msg.content }}</p>
        <small
          ><strong>{{ msg.participant.email }}</strong> {{ msg.createdAt
          }}</small
        >
      </div>
      <!-- 
        Our message input is bound to the newMessage data property.
       -->
      <div class="input">
        <input
          type="text"
          placeholder="Say something..."
          v-model="newMessage"
        />
        <!-- 
          When the user clicks the send button, we run the createMessage function.
         -->
        <button @click="createMessage">Send</button>
      </div>
    </div>
    <!-- 
      The sign up flow simply asks the user to enter an email address. Once the
      input is blurred, the createUser method is executed.
     -->
    <div v-else class="signup">
      <label for="email">Sign up to chat!</label>
      <br />
      <input
        type="text"
        v-model="me.email"
        placeholder="What's your email?"
        @blur="createUser"
        required
      />
    </div>
  </div>
</template>

<script>
/* eslint-disable no-debugger */
import Api from "./utils/api";
import Wss from "./utils/wss";

/* graphQL operations */
import {
  InitialChatData,
  CreateUser,
  DeleteUser,
  UsersSubscription,
  CreateMessage,
  MessagesSubscription,
} from "./utils/graphql";

/* Styles */
import "../assets/styles.css";

export default {
  name: "GroupChat",

  data: () => ({
    messages: [],
    newMessage: "",
    me: { email: "" },
    users: [],
  }),
  methods: {
    /**
     * Create the new user using a submitted email address.
     */
    createUser() {
      Api.mutate({
        mutation: CreateUser,
        variables: {
          email: this.me.email,
        },
      });
    },
    /**
     * Delete a user by their ID.
     */
    deleteUser() {
      Api.mutate({
        mutation: DeleteUser,
        variables: { id: this.me.id },
      });
    },
    /**
     * Our users subscription listing to both the create and update events, and
     * therefore we need to choose the apprpriate method to handle the response
     * based on the mutation type.
     *
     * Here, we have an object that looks up the mutation type by name, returns
     * it and executes the function while passing the event node.
     */
    handleUser({
      data: {
        Users: { mutation, node },
      },
    }) {
      ({
        create: this.addUser,
        delete: this.removeUser,
      }[mutation](node));
    },
    /**
     * Adds a new user to users array, first checking whether the user
     * being added is the current user.
     */
    addUser(user) {
      if (this.me.email === user.email) {
        this.me = user;
      }

      this.users.push(user);
    },
    /**
     * Removes user from the users array by ID.
     */
    removeUser(user) {
      this.users = this.users.filter(
        (p) => p.id != user.id
      );
    },
    /* Create a new message */
    createMessage() {
      Api.mutate({
        mutation: CreateMessage,
        variables: {
          id: this.me.id,
          content: this.newMessage,
        },
      }).then(() => (this.newMessage = ""));
    },
    /**
     * Our messages subscription only listens to the create event. Therefore, all we
     * need to do is push it into our messages array.
     */
    addMessage({
      data: {
        Messages: { node },
      },
    }) {
      this.messages.push(node);
    },
    /**
     * We'll want to close our subscriptions and delete the user. This method can be
     * called in our beforeDestroy lifecycle hook and any other relevantly placed callback.
     */
    closeChat () {
      /* Close subscriptions before exit */
      Wss.close()
      /* Delete participant */
      this.deleteUser();
      /* Set me to default */
      this.me = { email: '' };
    }
  },
  /**
   * Lifecycle hook executed when the component is created.
   */
  created() {
    /**
     * Create Subscription that triggers event when user is created or deleted
     */
    Wss.subscribe(UsersSubscription, {
      data: this.handleUser,
    });
    /**
     * Create Subscription that triggers event when message is created
     */
    Wss.subscribe(MessagesSubscription, {
      data: this.addMessage,
    });
    /**
     * Fetch initial chat data (Users and last 10 Messages)
     */
    Api.query({
      query: InitialChatData,
    }).then(({ data }) => {
      this.users = data.usersList.items;
      this.messages = data.messagesList.items;
    });
    /**
     * Callback executed on page refresh to close chat
     */
    window.onbeforeunload = this.closeChat;
  },
  /**
   * Lifecycle hook executed before the component is destroyed.
   */
  beforeDestroy() {
    this.closeChat();
  },
};
</script>
