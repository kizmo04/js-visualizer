import React, { Component } from "react";
import styles from "./ScopeInfo.module.scss";
import _ from "lodash";

class ScopeInfo extends Component {
  render() {
    const { scopeHistory, currentScope, operationType } = this.props;
    return (
      <div className={`${styles.logBox}`}>
        <h2 className={`${styles.font} ${styles.underline} has-text-success`}>
          {operationType ? `${operationType}` : null}
        </h2>
        {_.map([...scopeHistory, currentScope], (scope, index) => (
          <div className={`${styles.scopeBox}`}>
            {_.map(scope, (info, key) => {
              if (key === "scopeName") {
                return (
                  <h2 className={`${styles.font} ${styles.closure} has-text-success`}>
                    {info.value} Closure
                  </h2>
                );
              } else {
                return (
                  <p className={`${styles.font} has-text-success`}>{`${key}: ${
                    info.value
                  }`}</p>
                );
              }
            })}
          </div>
        ))}
      </div>
    );
  }
}

export default ScopeInfo;