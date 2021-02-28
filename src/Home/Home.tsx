import React from 'react';
import goggles from '../assets/goggles.png';
import ToolsNav from '../ToolsNav/ToolsNav';

const Home = (): JSX.Element => {
  return (
    <div className="p-4">
      <article className="flex flex-col lg:flex-row lg:flex-row-reverse	lg:justify-end lg:items-center lg:px-10">
        <div className="lg:flex-1 lg:self-center">
          <section className="flex justify-center">
            <img
              src={goggles}
              className="max-w-xs max-h-xs md:max-w-md md:max-h-md lg:max-w-xl lg:max-h-xl"
            />
          </section>
        </div>
        <div className="lg:text-xl 2xl:text-2xl">
          <section className="mb-4 lg:mb-8">
            <h1 className="text-2xl font-bold lg:text-4xl">Human Tools</h1>
            <p>
              A collection of simple utility tools that has data privacy and
              security in mind.
            </p>
            <div className="my-2">
              <ToolsNav
                showHome={false}
                className="text-xs p-1 mr-1 inline-block mb-1 bg-blue-300 lg:text-sm lg:p-2 lg:m-1 hover:bg-blue-500"
                activeClassName=""
              />
            </div>
          </section>
          <section className="mb-4 lg:mb-8">
            <h2 className="text-md font-bold">Guiding Principles</h2>
            <ul className="list-disc ml-10">
              <li>No user data is ever uploaded to any server</li>
              <li>All processing happens on users devices</li>
              <li>No need to install software on your devices</li>
            </ul>
          </section>
          <section className="mb-4 lg:mb-8">
            <h2 className="text-md font-bold">Come Learn and Build with Us</h2>
            <p>
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
            <h2 className="text-md font-bold">Credits</h2>
            <ul className="list-disc ml-10">
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
