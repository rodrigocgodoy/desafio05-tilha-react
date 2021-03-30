import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Header from '../../components/Header';
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
  const router = useRouter();
  const readTime = useMemo(() => {
    const readingTime = data?.content?.reduce((total, content) => {
      let counter = 0;
      if (content.heading) {
        counter += content.heading.split(' ').length;
      }
      if (content.body) {
        content.body.map(body => {
          counter += RichText.asText([body]).split(' ').length;
          return null;
        });
      }
      return total + counter;
    }, 0);

    return Math.ceil(readingTime / 200);
  }, [data]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{data.title} | spacetraveling</title>
      </Head>
      <Header />
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
                <span>
                  {format(new Date(first_publication_date), 'dd MMM yyyy', {
                    locale: ptBR,
                  })}
                </span>
              </span>
              <span>
                <FiUser color="#BBBBBB" />
                <span>{data.author}</span>
              </span>
              <span>
                <FiClock color="#BBBBBB" />
                <span>{readTime} min</span>
              </span>
            </div>
            <div className={styles.postContent}>
              {data.content?.map((content, index) => {
                return (
                  <div key={`post-${index + 1}`}>
                    <h2>{content.heading}</h2>
                    {content.body.map(body => (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: RichText.asHtml([body]),
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
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

  posts.results?.map(post =>
    paths.push({
      params: {
        slug: post.uid,
      },
    })
  );

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
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  console.log(JSON.stringify(response.data.content));

  const readingTime = response.data.content.reduce((total, content) => {
    let counter = 0;
    if (content.body) {
      content.body.map(body => {
        counter += RichText.asText([body]).split('').length;
        return null;
      });
    }
    return total + counter;
  }, 0);

  console.log(readingTime);

  return {
    props: {
      post,
      // readingTime: Math.round(readingTime / 200),
    },
  };
};
