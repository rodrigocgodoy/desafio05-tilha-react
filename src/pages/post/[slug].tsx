import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({
  post: { data, first_publication_date },
}: PostProps): JSX.Element {
  return (
    <>
      <Head>
        <title>{data.title} | spacetraveling</title>
      </Head>
      <main>
        <div className={styles.contentImg}>
          <img src={data.banner.url} alt={data.title} />
        </div>
        <div className={commonStyles.container}>
          <article className={styles.post}>
            <h1>{data.title}</h1>

            <div>
              <span>
                <FiCalendar color="#BBBBBB" />
                <span>{first_publication_date}</span>
              </span>
              <span>
                <FiUser color="#BBBBBB" />
                <span>{data.author}</span>
              </span>
              <span>
                <FiClock color="#BBBBBB" />
                <span>4 min</span>
              </span>
            </div>
            {/* <div className={styles.postContent} dangerouslySetInnerHTML={{ __html: content }} /> */}
          </article>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const paths = [];
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  posts.results?.map(post => paths.push(`/post/${post.uid}`));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body.map(body => {
            return {
              text: RichText.asHtml([body]),
            };
          }),
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
