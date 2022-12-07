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
          className={(navigationData) =>
            navigationData.isActive ? activeClassName : className
          }
          to="/"
        >
          Home
        </NavLink>
      )}
      <NavLink
        className={(navigationData) =>
          navigationData.isActive ? activeClassName : className
        }
        to="/combine-pdf"
      >
        Combine PDF
      </NavLink>
      <NavLink
        className={(navigationData) =>
          navigationData.isActive ? activeClassName : className
        }
        to="/split-pdf"
      >
        Split PDF
      </NavLink>
      <NavLink
        className={(navigationData) =>
          navigationData.isActive ? activeClassName : className
        }
        to="/create-photos-slideshow"
      >
        Photos Slideshow
      </NavLink>
      <NavLink
        className={(navigationData) =>
          navigationData.isActive ? activeClassName : className
        }
        to="/images-to-pdf"
      >
        Images to PDF
      </NavLink>

      <NavLink
        className={(navigationData) =>
          navigationData.isActive ? activeClassName : className
        }
        to="/quick-sign-pdf"
      >
        Quick Sign
      </NavLink>
      {showTodo && (
        <>
          <NavLink
            className={(navigationData) =>
              navigationData.isActive ? activeClassName : className
            }
            to="/bulk-sign"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Bulk Sign
          </NavLink>
          <NavLink
            className={(navigationData) =>
              navigationData.isActive ? activeClassName : className
            }
            to="/remove-meta"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Remove Meta
          </NavLink>
          <NavLink
            className={(navigationData) =>
              navigationData.isActive ? activeClassName : className
            }
            to="/make-gif"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Make GIF
          </NavLink>
          <NavLink
            className={(navigationData) =>
              navigationData.isActive ? activeClassName : className
            }
            to="/bulk-edit-photos"
          >
            <span className="text-xs bg-green-500 px-1 text-white">TODO</span>{' '}
            Bulk-Edit Photos
          </NavLink>
          <NavLink
            className={(navigationData) =>
              navigationData.isActive ? activeClassName : className
            }
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
