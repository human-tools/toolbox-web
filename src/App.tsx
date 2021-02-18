import * as React from 'react';
import CombinePDF from './CombinePDF/CombinePDF';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import workerContent from './pdfjs.worker.min.json';
import { GlobalWorkerOptions } from 'pdfjs-dist';

const workerBlob = new Blob([workerContent], { type: 'text/javascript' });
const workerBlobURL = URL.createObjectURL(workerBlob);
GlobalWorkerOptions.workerSrc = workerBlobURL;

export const App = (): JSX.Element => {
  return (
    <Router>
      <div className="bg-gray-100 h-screen">
        <div className="grid grid-cols-12">
          <div className="col-span-3 p-4 pr-0">
            <div className="flex flex-col space-y-2">
              <div className="px-3 py-2 bg-white shadow-md rounded">
                <Link to="/">Home</Link>
              </div>
              <div className="px-3 py-2 bg-white shadow-md rounded">
                <Link to="/combine-pdf">Combine PDF</Link>
              </div>
              <div className="px-3 py-2 bg-white shadow-md rounded">
                <Link to="/split-pdf">Split PDF</Link>
              </div>
            </div>
          </div>
          <div className="col-span-9 p-4 h-screen">
            <div className="bg-white h-full p-4 shadow-md rounded">
              <Switch>
                <Route path="/" exact>
                  <div>
                    <h1>Home sweet home</h1>
                  </div>
                </Route>
                <Route path="/combine-pdf" exact>
                  <CombinePDF />
                </Route>
                <Route path="/split-pdf" exact>
                  <div>
                    <h1>Split PDF</h1>
                    <p>TODO</p>
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
