// gql converts the query strings into graphQL documents
import gql from "graphql-tag";

// 1. Fetch all online chat Users and last 10 messages
export const InitialChatData = gql`
  {
    usersList {
      items {
        id
        email
      }
    }
    messagesList(last: 10) {
      items {
        content
        createdAt
        author {
          id
          email
        }
      }
    }
  }
`;

// 2. Create new chat users and assign them the Guest role
export const CreateUser = gql`
  mutation($email: String!) {
    userCreate(data: { email: $email, roles: { connect: { name: "Guest" } } }) {
      id
    }
  }
`;

// 3. Delete a chat user
export const DeleteUser = gql`
  mutation($id: ID!) {
    userDelete(data: { id: $id, force: true }) {
      success
    }
  }
`;

// 4. Listen for when chat users are created or deleted
export const UsersSubscription = gql`
  subscription {
    Users(filter: { mutation_in: [create, delete] }) {
      mutation
      node {
        id
        email
      }
    }
  }
`;

// 5. Create new chat messages and connect it to it's author
export const CreateMessage = gql`
  mutation($id: ID!, $content: String!) {
    messageCreate(
      data: { content: $content, author: { connect: { id: $id } } }
    ) {
      id
    }
  }
`;

// 6. Listen for when chat messages are created.
export const MessagesSubscription = gql`
  subscription {
    Messages(filter: { mutation_in: create }) {
      node {
        content
        createdAt
        author {
          id
          email
        }
      }
    }
  }
`;