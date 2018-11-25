import ApolloClient, { gql } from 'apollo-boost';
import 'cross-fetch/polyfill';

import 'dotenv/config';

const client = new ApolloClient({
  uri: 'https://api.github.com/graphql',
  request: operation => {
    operation.setContext({
      headers: {
        authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
      },
    });
  },
});

const GET_REPOSITORIES_OF_ORGANIZATION = gql`
  query($organization: String!, $cursor: String) {
    organization(login: $organization) {
      name
      url
      description
      repositories(first: 5, after: $cursor, orderBy: { direction: DESC, field: STARGAZERS }) {
        edges {
          node {
            ...RepositoryNodeFragment
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }

  fragment RepositoryNodeFragment on Repository {
    name
    url
  }
`;


client.
  query({
    query: GET_REPOSITORIES_OF_ORGANIZATION,
    variables: {
      organization: "the-road-to-learn-react",
      cursor: undefined,
    },
  })
  .then(result => {
    const { pageInfo, edges } = result.data.organization.repositories;
    const { endCursor, hasNextPage } = pageInfo;

    console.log('second page', edges.length);
    console.log('endCursor', endCursor);

    return pageInfo;
  })
  .then(({ endCursor, hasNextPage }) => {
    if (!hasNextPage) {
      throw Error('No next page.');
    }

    return client.query({
      query: GET_REPOSITORIES_OF_ORGANIZATION,
      variables: {
        organization: "the-road-to-learn-react",
        cursor: endCursor,
      },
    });
  })
  .then(result => {
    const { pageInfo, edges } = result.data.organization.repositories;
    const { endCursor, hasNextPage } = pageInfo;

    console.log('second page', edges.length);
    console.log('endCursor', endCursor);

    return pageInfo;
  })
  .catch(console.log);

const ADD_STAR = gql`
  mutation AddStar($repositoryId: ID!) {
    addStar(input: { starrableId: $repositoryId }) {
      starrable {
        id
        viewerHasStarred
      }
    }
  }
`;

const REMOVE_STAR = gql`
  mutation RemoveStar($repositoryId: ID!) {
    removeStar(input: { starrableId: $repositoryId }) {
      starrable {
        id
        viewerHasStarred
      }
    }
  }
`;

client
  .mutate({
    mutation: REMOVE_STAR,
    variables: {
      repositoryId: 'MDEwOlJlcG9zaXRvcnk2MzM1MjkwNw==',
    },
  })
  .then(console.log);
