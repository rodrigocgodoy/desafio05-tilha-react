import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState<Post[]>(() => {
    return results;
  });
  const [nextPage, setNextPage] = useState(() => {
    return next_page;
  });

  const handleLoadMorePosts = async (): Promise<void> => {
    fetch(next_page)
      .then(response => response.json())
      .then(data => {
        setNextPage(data.next_page);
        const dataPost = data.results?.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setPosts([...posts, ...dataPost]);
      });
  };

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        {posts.map(post => (
          <Link href={`/posts/${post.uid}`} key={post.uid}>
            <a className={styles.post}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div>
                <span>
                  <FiCalendar color="#BBBBBB" />
                  <span>{post.first_publication_date}</span>
                </span>
                <span>
                  <FiUser color="#BBBBBB" />
                  <span>{post.data.author}</span>
                </span>
              </div>
            </a>
          </Link>
        ))}

        {nextPage ? (
          <button
            type="button"
            className={styles.button}
            onClick={handleLoadMorePosts}
          >
            Carregar mais posts
          </button>
        ) : (
          ''
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.slug', 'post.author'],
      pageSize: 1,
    }
  );

  const postsPagination = postsResponse?.results?.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsPagination,
      },
    },
  };
};
