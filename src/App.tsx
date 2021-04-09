import * as React from 'react';
import CombinePDF from './CombinePDF/CombinePDF';
import GeneratePDFFromImages from './GenearatePDF/GeneratePDF';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import workerContent from './pdfjs.worker.min.json';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import Home from './Home/Home';
import ToolsNav from './ToolsNav/ToolsNav';
import buildtogether from './assets/buildtogether.png';
import CreatePhotosSlideshow from './CreatePhotosSlideshow/CreatePhotosSlideshow';
import SplitPDF from './SplitPDF/SplitPDF';

const workerBlob = new Blob([workerContent], { type: 'text/javascript' });
const workerBlobURL = URL.createObjectURL(workerBlob);
GlobalWorkerOptions.workerSrc = workerBlobURL;

export const App = (): JSX.Element => {
  return (
    <Router>
      <div className="bg-gray-100 h-screen">
        <div className="h-full flex flex-col">
          <div className="flex-grow-0 mx-2 mt-3">
            <ToolsNav showTodo={false} />
          </div>
          <div className="flex-grow">
            <div className="bg-white h-full shadow-md rounded-b">
              <Switch>
                <Route path="/" exact>
                  <Home />
                </Route>
                <Route path="/combine-pdf" exact>
                  <CombinePDF />
                </Route>
                <Route path="/split-pdf" exact>
                  <SplitPDF />
                </Route>
                <Route path="/create-photos-slideshow" exact>
                  <CreatePhotosSlideshow />
                </Route>
                <Route path="/images-to-pdf" exact>
                  <GeneratePDFFromImages />
                </Route>
                <Route path="/*">
                  <div className="p-4 flex flex-col justify-center items-center content-center h-full">
                    <div>
                      <span className="px-1 text-xs font-bold bg-green-500 text-white">
                        To Be Built
                      </span>
                    </div>
                    <div>
                      <img
                        src={buildtogether}
                        className="max-w-xs lg:max-w-lg"
                      />
                    </div>
                    <h1 className="text-2xl font-bold max-w-lg my-5">
                      Come Learn and Build with Us
                    </h1>
                    <p className="max-w-lg">
                      Feel free to get in touch on{' '}
                      <a
                        className="underline"
                        href="https://github.com/human-tools"
                        target="_blank"
                      >
                        our repo
                      </a>{' '}
                      if you'd like to help us build this tool and come learn
                      with us, we're pretty friendly and happy to help guide
                      throught the process. Or let us know if you'd like to see
                      us build a tool you need.
                    </p>
                  </div>
                </Route>
              </Switch>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
