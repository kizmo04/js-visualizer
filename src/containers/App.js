import { connect } from "react-redux";
import AppComponent from "../components/App/App";
import {
  codeChanged,
  currentScopeUpdated,
  highlightMarkerAppended,
  nextStepDecided,
  operationTypeUpdated,
  interpreterRunning,
  interpreterStopped,
  runningSpeedChanged,
  interpreterStateReset,
  codeShared,
  modalClosed,
  infoModalOpened,
} from "../actions";

const mapStateToProps = state => Object.assign({}, state);

const mapDispatchToProps = dispatch => ({
  getSharedCodeId(sharedCodeId) {
    dispatch(codeShared(sharedCodeId));
  },
  setChangedCode(code) {
    dispatch(codeChanged(code));
  },
  updateCurrentScope(currentScope) {
    dispatch(currentScopeUpdated(currentScope));
  },
  decideNextStep(hasNextStep) {
    dispatch(nextStepDecided(hasNextStep));
  },
  appendHighlightMarker() {
    dispatch(highlightMarkerAppended());
  },
  updateOperationType(operationType) {
    dispatch(operationTypeUpdated(operationType));
  },
  runInterpreter() {
    dispatch(interpreterRunning());
  },
  stopInterpreter() {
    dispatch(interpreterStopped());
  },
  changeRunningSpeed(runningSpeed) {
    dispatch(runningSpeedChanged(runningSpeed));
  },
  resetInterpreterState() {
    dispatch(interpreterStateReset());
  },
  closeModal() {
    dispatch(modalClosed());
  },
  openInfoModal() {
    dispatch(infoModalOpened());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppComponent);
