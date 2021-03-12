import React from 'react';
import { NavLink } from 'react-router-dom';

interface ToolsNavProps {
  showTodo?: boolean;
  showHome?: boolean;
  className?: string;
  activeClassName?: string;
}

const ToolsNav = ({
  showHome = true,
  showTodo = true,
  className = 'mr-1 px-3 py-2 rounded-t bg-white bg-opacity-40 text-black text-opacity-20 hover:bg-opacity-90',
  activeClassName = 'bg-opacity-100 text-opacity-100 font-bold',
}: ToolsNavProps): JSX.Element => {
  return (
    <>
      {showHome && (
        <NavLink
          exact
          className={className}
          activeClassName={activeClassName}
          to="/"
        >
          Home
        </NavLink>
      )}
      <NavLink
        exact
        className={className}
        activeClassName={activeClassName}
        to="/combine-pdf"
      >
        Combine PDF
      </NavLink>
      <NavLink
        exact
        className={className}
        activeClassName={activeClassName}
        to="/create-photos-slideshow"
      >
        Photos Slideshow
      </NavLink>

      {showTodo && (
        <>
          <NavLink
            exact
            className={className}
            activeClassName={activeClassName}
            to="/split-pdf"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Split PDF
          </NavLink>
          <NavLink
            exact
            className={className}
            activeClassName={activeClassName}
            to="/quick-sign"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Quick Sign
          </NavLink>
          <NavLink
            exact
            className={className}
            activeClassName={activeClassName}
            to="/bulk-sign"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Bulk Sign
          </NavLink>
          <NavLink
            exact
            className={className}
            activeClassName={activeClassName}
            to="/remove-meta"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Remove Meta
          </NavLink>
          <NavLink
            exact
            className={className}
            activeClassName={activeClassName}
            to="/make-gif"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Make GIF
          </NavLink>
          <NavLink
            exact
            className={className}
            activeClassName={activeClassName}
            to="/bulk-edit-photos"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Bulk-Edit Photos
          </NavLink>
          <NavLink
            exact
            className={className}
            activeClassName={activeClassName}
            to="/create-meme"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Create Meme
          </NavLink>
        </>
      )}
    </>
  );
};

export default ToolsNav;
