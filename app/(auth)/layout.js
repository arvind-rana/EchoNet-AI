const AuthLayout = ({ children }) => {
  return <div className="flex justify-center pt-48">{children}</div>;
};

export default AuthLayout;


// Difference Between Dynamic Route Types
// Syntax	Meaning	Example
// [slug]	Required dynamic segment	/blog/hello
// [...slug]	Required catch-all	/blog/a/b/c (must have path)
// [[...slug]]	Optional catch-all	/blog OR /blog/a/b