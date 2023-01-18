import { useQuery, useMutation } from "react-query";

async function fetchComments(postId) {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/comments?postId=${postId}`
  );
  return response.json();
}

async function deletePost(postId) {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/postId/${postId}`,
    { method: "DELETE" }
  );
  return response.json();
}

async function updatePost(postId, title) {
  console.log(postId, title);
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/postId/${postId}`,
    { method: "PATCH", data: { title } }
  );
  return response.json();
}

export function PostDetail({ post }) {
  // replace with useQuery
  // const data = [];

  const { data, isLoading, isError, error } = useQuery(
    ["comments", post.id],
    () => fetchComments(post.id)
  );

  const deleteMutation = useMutation((postId) => deletePost(postId));
  const updateMutation = useMutation(({ id, title }) => updatePost(id, title));

  if (isLoading) return <div>Loading...</div>;

  if (isError)
    return (
      <>
        <h3>Error</h3>
        <p>${error.toString()}</p>
      </>
    );

  const handleUpdate = (e) => {
    e.preventDefault();
    const { value: title } = e.target.elements["newTitle"];
    updateMutation.mutate({ id: post.id, title });
  };

  return (
    <>
      <h3 style={{ color: "blue" }}>{post.title}</h3>
      <button onClick={() => deleteMutation.mutate(post.id)}>Delete</button>
      {deleteMutation.isError && (
        <p style={{ color: "red" }}>Error deleting the post</p>
      )}
      {deleteMutation.isLoading && (
        <p style={{ color: "purple" }}>Deleting the post</p>
      )}
      {deleteMutation.isSuccess && (
        <p style={{ color: "green" }}>Post has (not) been deleted</p>
      )}
      <form onSubmit={handleUpdate}>
        <input type="text" name="newTitle"></input>
        <button type="submit">Update title</button>
      </form>
      {updateMutation.isError && (
        <p style={{ color: "red" }}>Error Updating the post's title</p>
      )}
      {updateMutation.isLoading && (
        <p style={{ color: "purple" }}>Updating the post's title</p>
      )}
      {updateMutation.isSuccess && (
        <p style={{ color: "green" }}> Post title has (not) been updated</p>
      )}
      <p>{post.body}</p>
      <h4>Comments</h4>
      {data.map((comment) => (
        <li key={comment.id}>
          {comment.email}: {comment.body}
        </li>
      ))}
    </>
  );
}
