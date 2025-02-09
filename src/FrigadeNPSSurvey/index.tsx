import { DefaultFrigadeFlowProps } from '../types'
import React, { useEffect } from 'react'
import { useFlows } from '../api/flows'
import { useCTAClickSideEffects } from '../hooks/useCTAClickSideEffects'
import { useTheme } from '../hooks/useTheme'
import { COMPLETED_FLOW } from '../api/common'
import { RenderInlineStyles } from '../components/RenderInlineStyles'
import { Portal } from 'react-portal'
import {
  DismissButton,
  NPSLabel,
  NPSLabelContainer,
  NPSNumberButton,
  NPSNumberButtonContainer,
  NPSSurveyContainer,
  TextArea,
  TextContainer,
} from './styled'
import { getClassName, mergeClasses } from '../shared/appearance'
import { Close } from '../components/Icons/Close'
import { TitleSubtitle } from '../components/TitleSubtitle/TitleSubtitle'
import { useFlowOpens } from '../api/flow-opens'
import { Button } from '../components/Button'

export interface FrigadeNPSSurveyProps extends DefaultFrigadeFlowProps {
  dismissible?: boolean
}

export const FrigadeNPSSurvey: React.FC<FrigadeNPSSurveyProps> = ({
  flowId,
  onDismiss,
  customVariables,
  onButtonClick,
  appearance,
  className,
  style,
}) => {
  const {
    getFlow,
    markFlowCompleted,
    markStepCompleted,
    getNumberOfStepsCompleted,
    isLoading,
    targetingLogicShouldHideFlow,
    updateCustomVariables,
    getFlowSteps,
    getFlowStatus,
    getCurrentStepIndex,
  } = useFlows()
  const { primaryCTAClickSideEffects } = useCTAClickSideEffects()
  const { mergeAppearanceWithDefault } = useTheme()
  const [score, setScore] = React.useState<number | null>(null)
  const [feedbackText, setFeedbackText] = React.useState<string>('')
  const {
    hasOpenModals,
    setKeepCompletedFlowOpenDuringSession,
    shouldKeepCompletedFlowOpenDuringSession,
  } = useFlowOpens()

  appearance = mergeAppearanceWithDefault(appearance)

  useEffect(() => {
    updateCustomVariables(customVariables)
  }, [customVariables, isLoading])

  if (isLoading) {
    return null
  }

  const flow = getFlow(flowId)
  if (!flow) {
    return null
  }

  if (targetingLogicShouldHideFlow(flow)) {
    return null
  }

  if (getFlowStatus(flowId) === COMPLETED_FLOW) {
    return null
  }

  if (
    getNumberOfStepsCompleted(flowId) === 1 &&
    !shouldKeepCompletedFlowOpenDuringSession(flowId)
  ) {
    return null
  }

  if (hasOpenModals()) {
    return null
  }

  const steps = getFlowSteps(flowId)

  const currentStep = steps[getCurrentStepIndex(flowId)]

  function getScoreChooser() {
    return (
      <>
        <TextContainer>
          <TitleSubtitle
            size="large"
            appearance={appearance}
            title={currentStep.title}
            subtitle={currentStep.subtitle}
          />
        </TextContainer>
        <NPSNumberButtonContainer
          className={getClassName('npsNumberButtonContainer', appearance)}
          appearance={appearance}
        >
          {Array.from(Array(10).keys()).map((i) => (
            <NPSNumberButton
              className={getClassName('npsNumberButton', appearance)}
              selected={score === i + 1}
              key={i}
              onClick={async () => {
                setKeepCompletedFlowOpenDuringSession(flowId)
                setScore(i + 1)
                await markStepCompleted(flowId, currentStep.id, { score: i + 1 })
              }}
              appearance={appearance}
            >
              {i + 1}
            </NPSNumberButton>
          ))}
        </NPSNumberButtonContainer>
        <NPSLabelContainer appearance={appearance}>
          <NPSLabel appearance={appearance}>Not likely at all</NPSLabel>
          <NPSLabel appearance={appearance}>Extremely likely</NPSLabel>
        </NPSLabelContainer>
      </>
    )
  }

  function getScoreReason() {
    return (
      <>
        <TextContainer>
          <TitleSubtitle
            appearance={appearance}
            title={`Why did you choose this score?`}
            size="large"
          />
        </TextContainer>
        <TextArea
          appearance={appearance}
          value={feedbackText}
          onChange={(e) => {
            setFeedbackText(e.target.value)
          }}
          placeHolder="Add your optional fedback here..."
        ></TextArea>
        <NPSNumberButtonContainer
          appearance={appearance}
          className={getClassName('npsNumberButtonContainer', appearance)}
        >
          <Button
            size={'large'}
            withMargin={false}
            onClick={async () => {
              await markFlowCompleted(flowId)
              if (onButtonClick) {
                onButtonClick(currentStep, 1, 'primary')
              }
            }}
            appearance={appearance}
            title={currentStep.secondaryButtonTitle || 'Skip'}
            secondary
          />
          <Button
            size={'large'}
            withMargin={false}
            onClick={async () => {
              await markStepCompleted(flowId, currentStep.id, { feedbackText })
              await markFlowCompleted(flowId)
              if (onButtonClick) {
                onButtonClick(currentStep, 1, 'primary')
              }
            }}
            appearance={appearance}
            title={currentStep.primaryButtonTitle || 'Submit'}
          />
        </NPSNumberButtonContainer>
      </>
    )
  }

  return (
    <Portal>
      <RenderInlineStyles appearance={appearance} />
      <NPSSurveyContainer
        appearance={appearance}
        className={mergeClasses(getClassName('npsSurveyContainer', appearance), className)}
        style={style}
      >
        <DismissButton
          onClick={async () => {
            await markFlowCompleted(flowId)
            if (onDismiss) {
              onDismiss()
            }
          }}
          className={getClassName('npsSurveyDismissButton', appearance)}
        >
          <Close />
        </DismissButton>
        {getNumberOfStepsCompleted(flowId) == 0 && getScoreChooser()}
        {getNumberOfStepsCompleted(flowId) == 1 && getScoreReason()}
      </NPSSurveyContainer>
    </Portal>
  )
}
