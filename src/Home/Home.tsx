import ToolsNav from '../ToolsNav/ToolsNav';

const Home = (): JSX.Element => {
  return (
    <div className="p-4">
      <article className="flex flex-col lg:flex-row lg:flex-row-reverse	lg:justify-end lg:items-center lg:px-10">
        <div className="lg:text-xl 2xl:text-xl">
          <section className="mb-4 lg:mb-8">
            <h1 className="text-2xl font-medium lg:text-5xl my-10">
              Human Tools
            </h1>
            <p className="font-light">
              A collection of simple utility tools that has data privacy and
              security in mind.
            </p>
            <div className="my-10 flex flex-wrap">
              <ToolsNav
                showHome={false}
                className="font-light inline-flex w-60 h-20 items-center justify-center text-xs p-10 shadow rounded-lg text-center lg:text-xl lg:p-2 lg:m-2 bg-gradient-to-r hover:from-gray-100 hover:to-cian-500"
                activeClassName=""
              />
            </div>
          </section>
          <section className="mb-4 lg:mb-10">
            <h2 className="text-md font-medium">Guiding Principles</h2>
            <ul className="list-disc ml-10 font-extralight">
              <li>No user data is ever uploaded to any server</li>
              <li>All processing happens on users devices</li>
              <li>No need to install software on your devices</li>
            </ul>
          </section>
          <section className="mb-4 lg:mb-10">
            <h2 className="text-md font-medium">
              Come Learn and Build with Us
            </h2>
            <p className="font-extralight">
              Feel free to get in touch on{' '}
              <a
                className="underline"
                href="https://github.com/human-tools"
                target="_blank"
              >
                our repo
              </a>{' '}
              if you'd like to learn and build tools for others to use
            </p>
          </section>
          <section className="mb-4 lg:mb-8">
            <h2 className="text-md font-medium">Credits</h2>
            <ul className="list-disc ml-10 font-extralight">
              <li>
                <a
                  className="underline"
                  href="https://absurd.design/"
                  target="_blank"
                >
                  Absurd.design
                </a>{' '}
                - for the beautiful absurd illustrations
              </li>
            </ul>
          </section>
        </div>
      </article>
    </div>
  );
};

export default Home;
