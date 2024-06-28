import React from 'react';
import BlogPostPage from '@theme-original/BlogPostPage';
import type BlogPostPageType from '@theme/BlogPostPage';
import type { WrapperProps } from '@docusaurus/types';
import Comment from '@site/src/components/Comment'
import Translate, { translate } from '@docusaurus/Translate';

type Props = WrapperProps<typeof BlogPostPageType>;

export default function BlogPostPageWrapper(props: Props): JSX.Element {
  return (
    <>
      <BlogPostPage {...props} />
      <div className='container margin-vert--lg'>
        <div className="row">
          <div className='col col--3'></div>
          <div className='col col--7'><Translate>blog-footer</Translate></div>
        </div>
      </div>
      <Comment />
    </>
  );
}
