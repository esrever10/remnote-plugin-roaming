import clsx from "clsx";

export default function ConfirmDialog(props: any) {
  const { open, onClose, title, children, onConfirm, ref } = props;
  if (!open) {
    return <></>;
  }
  return (
    <div
      id="popup-modal"
      tabIndex={-1}
      className="flex"
    >
      <div className="relative p-4 w-full max-w-md h-full md:h-auto">
        <div className="relativerounded-lg shadow">
          <div className="p-6 text-center">
            <svg
              aria-hidden="true"
              className={clsx("mx-auto mb-4 w-14 h-14 text-gray-400", props.dark && "dark:text-gray-200")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <h3 className={clsx("mb-5 text-lg font-normal text-gray-500", props.dark && "dark:text-gray-400")}>
              Are you sure you want to reset your roaming statistics data?
            </h3>
            <button
              onClick={onConfirm}
              data-modal-toggle="popup-modal"
              type="button"
              className={clsx("text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-600 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center mr-2", props.dark && "dark:bg-red-300 dark:hover:bg-red-500 dark:focus:ring-red-500")}
            >
              Yes, sure.
            </button>
            <button
              onClick={onClose}
              data-modal-toggle="popup-modal"
              type="button"
              className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
            >
              No, cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// renderWidget(ConfirmDialog);