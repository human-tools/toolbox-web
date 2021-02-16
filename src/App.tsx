import React from 'react';

function App(): JSX.Element {
  return (
    <div className="max-w-xl mx-auto py-12 md:max-w-4xl">
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="grid grid-cols-1 gap-6">
          <label className="block">
            <span className="text-gray-700">Input (text)</span>
            <input
              type="text"
              className="mt-1 block w-full"
              placeholder="john@example.com"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (email)</span>
            <input
              type="email"
              className="mt-1 block w-full"
              placeholder="john@example.com"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (email, multiple)</span>
            <input
              type="email"
              multiple
              className="mt-1 block w-full"
              placeholder="john@example.com"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (password)</span>
            <input
              type="password"
              className="mt-1 block w-full"
              placeholder="john@example.com"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (date)</span>
            <input type="date" className="mt-1 block w-full" />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (datetime-local)</span>
            <input type="datetime-local" className="mt-1 block w-full" />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (month)</span>
            <input type="month" className="mt-1 block w-full" />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (number)</span>
            <input type="number" className="mt-1 block w-full" />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (search)</span>
            <input type="search" className="mt-1 block w-full" />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (time)</span>
            <input type="time" className="mt-1 block w-full" />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (week)</span>
            <input type="week" className="mt-1 block w-full" />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <label className="block">
            <span className="text-gray-700">Input (tel)</span>
            <input
              type="tel"
              multiple
              className="mt-1 block w-full"
              placeholder="john@example.com"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Input (url)</span>
            <input
              type="url"
              multiple
              className="mt-1 block w-full"
              placeholder="john@example.com"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Select</span>
            <select className="block w-full mt-1">
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </label>
          <label className="block">
            <span className="text-gray-700">Select (multiple)</span>
            <select className="block w-full mt-1">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
              <option>Option 4</option>
              <option>Option 5</option>
            </select>
          </label>
          <label className="block">
            <span className="text-gray-700">Textarea</span>
            <textarea
              className="mt-1 block w-full h-24"
              placeholder="Enter some long form content."
            ></textarea>
          </label>
          <div className="block">
            <span className="text-gray-700">Checkboxes</span>
            <div className="mt-2">
              <div>
                <label className="inline-flex items-center">
                  <input type="checkbox" checked />
                  <span className="ml-2">Option 1</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input type="checkbox" />
                  <span className="ml-2">Option 2</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input type="checkbox" />
                  <span className="ml-2">Option 3</span>
                </label>
              </div>
            </div>
          </div>
          <div className="block">
            <span className="text-gray-700">Radio Buttons</span>
            <div className="mt-2">
              <div>
                <label className="inline-flex items-center">
                  <input type="radio" checked name="radio-direct" value="1" />
                  <span className="ml-2">Option 1</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input type="radio" name="radio-direct" value="2" />
                  <span className="ml-2">Option 2</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input type="radio" name="radio-direct" value="3" />
                  <span className="ml-2">Option 3</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
